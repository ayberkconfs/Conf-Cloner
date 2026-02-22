import { Client } from 'discord.js-selfbot-v13'
import axios from 'axios'

export async function deleteWebhook(url: string) {
  try {
    await axios.delete(url)
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function changeHypeSquad(token: string, houseId: number) {
  try {
    await axios.post('https://discord.com/api/v9/hypesquad/online', 
      { house_id: houseId },
      { headers: { Authorization: token } }
    )
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function checkToken(token: string) {
  const client = new Client({ checkUpdate: false })
  try {
    const loginPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timed out.')), 15000)
      client.once('ready', () => {
        clearTimeout(timeout)
        resolve(true)
      })
      client.login(token).catch((err) => {
        clearTimeout(timeout)
        reject(err)
      })
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
      hasNitro: client.user?.premiumType !== 'NONE' && client.user?.premiumType !== 0
    }
    client.destroy()
    return result
  } catch (error) {
    client.destroy()
    return { valid: false }
  }
}

async function sendToWebhook(url: string, msg: any) {
  try {
    let content = msg.content || ''
    const embeds = msg.embeds && msg.embeds.length > 0 ? msg.embeds.map((e: any) => {
      try { return typeof e.toJSON === 'function' ? e.toJSON() : e } catch { return e }
    }) : []

    if (!content && embeds.length === 0) {
      if (msg.attachments && msg.attachments.size > 0) {
        content = '_[Message contains attachments/media]_'
      } else {
        return 
      }
    }

    await axios.post(url, {
      username: msg.author?.username || 'Mirror System',
      avatar_url: msg.author?.displayAvatarURL?.() || '',
      content: content.substring(0, 2000),
      embeds: embeds.slice(0, 10)
    }).catch(() => {})
  } catch (err) {}
}

export async function mirrorChannel(
  token: string,
  sourceChannelId: string,
  webhookUrl: string,
  options: { pastMessages: boolean; live: boolean; limit?: number },
  onLog: (msg: string, type: 'info' | 'success' | 'error') => void,
  signal: { cancelled: boolean }
) {
  const client = new Client({ checkUpdate: false })
  // Count'u en tepeye taşıdım, her yerden erişilebilir olsun
  let transferredCount = 0;

  try {
    onLog('Connecting to Elite Engine...', 'info')
    
    await new Promise((resolve, reject) => {
      client.once('ready', () => resolve(true))
      client.login(token).catch(reject)
    })
    
    onLog(`Connected as ${client.user?.tag}`, 'success')

    const sourceChannel = await client.channels.fetch(sourceChannelId).catch(() => null) as any
    if (!sourceChannel) {
      throw new Error('Target channel not accessible.')
    }

    onLog(`Hooked to #${sourceChannel.name || 'channel'}`, 'info')

    // 1. Past Messages
    if (options.pastMessages) {
      const isUnlimited = options.limit === 0 || !options.limit;
      onLog(isUnlimited ? 'Scanning ENTIRE channel history...' : `Scanning last ${options.limit} messages...`, 'info')
      
      let lastId: string | undefined;
      let totalFetched = 0;
      const targetLimit = isUnlimited ? Infinity : Number(options.limit);

      while (totalFetched < targetLimit && !signal.cancelled) {
        const fetchAmount = Math.min(targetLimit - totalFetched, 100);
        const messageCollection: any = await sourceChannel.messages.fetch({ 
          limit: fetchAmount > 100 ? 100 : fetchAmount, 
          before: lastId 
        }).catch((err: any) => {
          onLog(`Fetch Error: ${err.message}`, 'error')
          return null
        })

        if (!messageCollection || messageCollection.size === 0) break;

        const messages = Array.from(messageCollection.values());
        onLog(`Batch: Sending ${messages.length} messages...`, 'info')

        for (const msg of messages.reverse() as any[]) {
          if (signal.cancelled) break
          await sendToWebhook(webhookUrl, msg)
          transferredCount++
          await new Promise(r => setTimeout(r, 800))
        }

        totalFetched += messages.length;
        lastId = messageCollection.lastKey();
        
        if (isUnlimited) {
          onLog(`Total transferred so far: ${transferredCount}`, 'info');
        }
      }
      
      onLog(`Elite Transfer Complete: ${transferredCount} items sent.`, 'success')
    }

    // 2. Live Sync
    if (options.live) {
      onLog('LIVE SYNC ACTIVE! Monitoring channel...', 'success')
      
      client.on('messageCreate', async (msg) => {
        if (signal.cancelled) return
        if (msg.channelId === sourceChannelId) {
          await sendToWebhook(webhookUrl, msg)
        }
      })

      while (!signal.cancelled) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }

  } catch (error: any) {
    onLog(`System Error: ${error.message}`, 'error')
  } finally {
    client.destroy()
    onLog('Engine shut down.', 'info')
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
      throw new Error('Process stopped.')
    }
  }

  try {
    onLog('Logging in...', 'info')
    
    await new Promise((resolve, reject) => {
      client.once('ready', () => resolve(true))
      client.login(token).catch(reject)
    })
    
    checkSignal()
    onLog(`Logged in as ${client.user?.tag}`, 'success')

    const sourceGuild = await client.guilds.fetch(sourceId)
    const targetGuild = await client.guilds.fetch(targetId)

    if (!sourceGuild || !targetGuild) {
      throw new Error('Guild access denied.')
    }

    onLog(`Mirroring ${sourceGuild.name} -> ${targetGuild.name}`, 'info')
    checkSignal()

    if (options.serverName) {
      await targetGuild.setName(sourceGuild.name)
    }
    if (options.serverIcon && sourceGuild.iconURL()) {
      await targetGuild.setIcon(sourceGuild.iconURL({ size: 1024 }))
    }

    const roleMap = new Map()
    if (options.roles) {
      onLog('Cloning roles...', 'info')
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
        }).catch(() => null)
        if (newRole) roleMap.set(role.id, newRole.id)
      }
    }

    if (options.channels) {
      onLog('Cloning channels...', 'info')
      const currentChannels = await targetGuild.channels.fetch()
      for (const c of currentChannels.values()) {
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
            id: roleMap.get(po.id) || targetGuild.id,
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
        }).catch(() => {})
      }
    }

    if (options.emojis) {
      onLog('Cloning emojis...', 'info')
      const emojis = await sourceGuild.emojis.fetch()
      for (const emoji of emojis.values()) {
        checkSignal()
        await targetGuild.emojis.create(emoji.url, emoji.name || 'emoji').catch(() => {})
      }
    }

    onLog('FINISHED!', 'success')

  } catch (error: any) {
    onLog(`CRITICAL: ${error.message}`, 'error')
  } finally {
    client.destroy()
  }
}
