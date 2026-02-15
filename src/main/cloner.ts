import { Client } from 'discord.js-selfbot-v13'

export async function checkToken(token: string) {
  const client = new Client({ checkUpdate: false })
  try {
    const loginPromise = new Promise((resolve, reject) => {
      client.once('ready', () => resolve(true))
      client.login(token).catch(reject)
    })
    
    await loginPromise
    const user = client.user
    
    const result = {
      valid: true,
      user: {
        id: user?.id,
        username: user?.username,
        discriminator: user?.discriminator,
        avatar: user?.avatar,
        tag: user?.tag
      },
      hasNitro: client.user?.premiumType !== 'NONE'
    }
    client.destroy()
    return result
  } catch (error) {
    client.destroy()
    return { valid: false }
  }
}

export async function cloneGuild(
  token: string, 
  sourceId: string, 
  targetId: string, 
  options: {
    roles: boolean;
    channels: boolean;
    emojis: boolean;
    stickers: boolean;
    serverIcon: boolean;
    serverName: boolean;
  },
  onLog: (msg: string, type: 'info' | 'success' | 'error') => void,
  signal: { cancelled: boolean }
) {
  const client = new Client({ checkUpdate: false })

  const checkSignal = () => {
    if (signal.cancelled) {
      throw new Error('Cloning process stopped by user.')
    }
  }

  try {
    onLog('Logging in with User Token...', 'info')
    
    const loginPromise = new Promise((resolve, reject) => {
      client.once('ready', () => resolve(true))
      client.login(token).catch(reject)
    })
    
    await loginPromise
    checkSignal()
    onLog(`Logged in as ${client.user?.tag}`, 'success')

    const sourceGuild = await client.guilds.fetch(sourceId)
    const targetGuild = await client.guilds.fetch(targetId)

    if (!sourceGuild || !targetGuild) {
      throw new Error('Source or Target guild not found or no access.')
    }

    onLog(`Cloning ${sourceGuild.name} -> ${targetGuild.name}`, 'info')
    checkSignal()

    // 1. Server Profile
    if (options.serverName) {
      onLog('Updating server name...', 'info')
      await targetGuild.setName(sourceGuild.name)
      checkSignal()
    }
    if (options.serverIcon && sourceGuild.iconURL()) {
      onLog('Updating server icon...', 'info')
      await targetGuild.setIcon(sourceGuild.iconURL({ size: 1024 }))
      checkSignal()
    }

    // 2. Roles
    const roleMap = new Map()
    if (options.roles) {
      onLog('Cloning roles...', 'info')
      // Clear existing
      const currentRoles = await targetGuild.roles.fetch()
      for (const r of currentRoles.values()) {
        checkSignal()
        if (!r.managed && r.name !== '@everyone') await r.delete().catch(() => {})
      }

      const roles = Array.from((await sourceGuild.roles.fetch()).values())
        .filter(r => !r.managed && r.name !== '@everyone')
        .reverse()

      for (const role of roles) {
        checkSignal()
        const newRole = await targetGuild.roles.create({
          name: role.name,
          color: role.color,
          hoist: role.hoist,
          permissions: role.permissions,
          mentionable: role.mentionable
        }).catch(err => {
          onLog(`Role error (${role.name}): ${err.message}`, 'error')
          return null
        })
        if (newRole) roleMap.set(role.id, newRole.id)
      }
      onLog('Roles completed.', 'success')
      checkSignal()
    }

    // 3. Channels
    if (options.channels) {
      onLog('Cloning channels...', 'info')
      // Clear existing
      const currentChannels = await targetGuild.channels.fetch()
      for (const c of currentChannels.values()) {
        checkSignal()
        if (c) await c.delete().catch(() => {})
      }

      const channels = Array.from((await sourceGuild.channels.fetch()).values())
      const categories = channels.filter(c => c?.type === 'GUILD_CATEGORY')
      const others = channels.filter(c => c?.type !== 'GUILD_CATEGORY')

      const categoryMap = new Map()

      for (const cat of categories) {
        checkSignal()
        if (!cat) continue
        const newCat = await targetGuild.channels.create(cat.name, {
          type: 'GUILD_CATEGORY',
          permissionOverwrites: cat.permissionOverwrites.cache.map(po => ({
            id: roleMap.get(po.id) || targetGuild.id, // Fallback to @everyone if role not found
            allow: po.allow,
            deny: po.deny,
            type: po.type
          }))
        })
        categoryMap.set(cat.id, newCat.id)
      }

      for (const chan of others) {
        checkSignal()
        if (!chan) continue
        await targetGuild.channels.create(chan.name, {
          type: chan.type as any,
          parent: chan.parentId ? categoryMap.get(chan.parentId) : null,
          topic: (chan as any).topic,
          nsfw: (chan as any).nsfw,
          rateLimitPerUser: (chan as any).rateLimitPerUser,
          permissionOverwrites: (chan as any).permissionOverwrites?.cache.map((po: any) => ({
            id: roleMap.get(po.id) || targetGuild.id,
            allow: po.allow,
            deny: po.deny,
            type: po.type
          }))
        }).catch(err => onLog(`Channel error (${chan.name}): ${err.message}`, 'error'))
      }
      onLog('Channels completed.', 'success')
      checkSignal()
    }

    // 4. Emojis
    if (options.emojis) {
      onLog('Cloning emojis...', 'info')
      const emojis = await sourceGuild.emojis.fetch()
      for (const emoji of emojis.values()) {
        checkSignal()
        await targetGuild.emojis.create(emoji.url, emoji.name || 'emoji').catch(() => {})
      }
      onLog('Emojis completed.', 'success')
      checkSignal()
    }

    onLog('CLONING FINISHED! Enjoy your premium server.', 'success')

  } catch (error: any) {
    onLog(`Critical Error: ${error.message}`, 'error')
  } finally {
    client.destroy()
  }
}
