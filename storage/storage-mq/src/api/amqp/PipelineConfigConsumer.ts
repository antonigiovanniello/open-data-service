import * as AMQP from 'amqplib'
import AmqpConsumer from '../../util/amqpConsumer'
import PipelineConfigEventHandler from '../pipelineConfigEventHandler'
import {
  AMQP_URL,
  AMQP_PIPELINE_CONFIG_EXCHANGE,
  AMQP_PIPELINE_CONFIG_TOPIC,
  AMQP_PIPELINE_CONFIG_QUEUE,
  AMQP_PIPELINE_CONFIG_CREATED_TOPIC,
  AMQP_PIPELINE_CONFIG_DELETED_TOPIC
} from '../../env'

export class PipelineConfigConsumer {
  private consumer: AmqpConsumer
  private pipelineConfigEventHandler: PipelineConfigEventHandler

  constructor (pipelineConfigEventHandler: PipelineConfigEventHandler, consumer: AmqpConsumer) {
    this.pipelineConfigEventHandler = pipelineConfigEventHandler
    this.consumer = consumer
  }

  async init (retries: number, msBackoff: number): Promise<void> {
    await this.consumer.init(AMQP_URL, retries, msBackoff)
    return this.consumer.consume(
      AMQP_PIPELINE_CONFIG_EXCHANGE,
      AMQP_PIPELINE_CONFIG_TOPIC,
      AMQP_PIPELINE_CONFIG_QUEUE,
      this.consumeEvent
    )
  }

  // use the f = () => {} syntax to access 'this' scope
  consumeEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (!msg) {
      console.debug('Received empty event when listening on pipeline configs - doing nothing')
      return
    }
    console.debug("[ConsumingEvent] %s:'%s'", msg.fields.routingKey, msg.content.toString())
    if (msg.fields.routingKey === AMQP_PIPELINE_CONFIG_CREATED_TOPIC) {
      await this.pipelineConfigEventHandler.handleCreation(JSON.parse(msg.content.toString()))
    } else if (msg.fields.routingKey === AMQP_PIPELINE_CONFIG_DELETED_TOPIC) {
      await this.pipelineConfigEventHandler.handleDeletion(JSON.parse(msg.content.toString()))
    } else {
      console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
    }
  }
}
