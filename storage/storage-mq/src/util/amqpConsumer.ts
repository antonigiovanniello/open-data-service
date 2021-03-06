import * as AMQP from 'amqplib'

import { sleep } from '../sleep'

export default class AmqpConsumer {
  private connection?: AMQP.Connection

  public async init (amqpUrl: string, retries: number, msBackoff: number): Promise<void> {
    let lastError: Error | undefined
    for (let i = 0; i <= retries; i++) {
      try {
        this.connection = await this.connect(amqpUrl)
        return
      } catch (error) {
        console.error(`Error connecting to AMQP (${i}/${retries})`)
        lastError = error
      }
      await sleep(msBackoff)
    }
    throw lastError
  }

  private async connect (amqpUrl: string): Promise<AMQP.Connection> {
    const connection = await AMQP.connect(amqpUrl)
    console.log(`Connection to amqp host at ${amqpUrl} successful`)
    return connection
  }

  private initChannel = async (connection: AMQP.Connection, exchange: string): Promise<AMQP.Channel> => {
    try {
      const channel = await connection.createChannel()
      await channel.assertExchange(exchange, 'topic', {
        durable: true
      })
      console.log(`Exchange ${exchange} successfully initialized.`)
      return channel
    } catch (error) {
      throw new Error(`Error creating exchange ${exchange}: ${error}`)
    }
  }

  public async consume (
    exchange: string,
    topic: string,
    queueName: string,
    consumeEvent: (msg: AMQP.ConsumeMessage | null) => void
  ): Promise<void> {
    if (!this.connection) {
      throw new Error('Consume not possible, AMQP client not initialized.')
    }

    try {
      const channel = await this.initChannel(this.connection, exchange)
      const q = await channel.assertQueue(queueName, {
        exclusive: false
      })
      await channel.bindQueue(q.queue, exchange, topic)
      await channel.consume(q.queue, consumeEvent)
    } catch (error) {
      throw new Error(`Error subscribing to exchange ${exchange} under key ${topic}: ${error}`)
    }
  }
}
