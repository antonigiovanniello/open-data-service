<template>
  <div class="pipeline-edit">
    <v-card class="mx-auto">
      <v-toolbar
        dense
        class="elevation-0"
      >
        <v-toolbar-title>
          <span v-if="isEditMode">Update Pipeline {{ dialogPipeline.id }}</span>
          <span v-else>Create new Pipeline for Datasource {{ dialogPipeline.datasourceId }}</span>
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-stepper
          v-model="dialogStep"
          vertical
        >
          <v-stepper-step
            :complete="dialogStep > 1"
            step="1"
          >
            Pipeline Name
            <small>Choose a name to display the pipeline</small>
          </v-stepper-step>
          <v-stepper-content step="1">
            <v-form
              v-model="validStep1"
            >
              <v-text-field
                v-model="dialogPipeline.metadata.displayName"
                label="Pipeline Name"
                :rules="[required]"
              />
              <v-text-field
                v-model.number="dialogPipeline.datasourceId"
                label="Referenced Datasource Id"
                :rules="[required]"
                :readonly="isDatasourcePreselected"
                type="number"
              />
            </v-form>
            <stepper-button-group
              :step="1"
              :next-enabled="validStep1"
              :previous-visible="false"
              @stepChanged="dialogStep = $event"
            />
          </v-stepper-content>

          <v-stepper-step
            :complete="dialogStep > 2"
            step="2"
          >
            Transformation
            <small>Customize data transformation</small>
          </v-stepper-step>
          <v-stepper-content step="2">
            <pipeline-transformation-config
              v-model="dialogPipeline.transformation"
              :datasource-id="dialogPipeline.datasourceId"
              @validityChanged="validStep2 = $event"
            />
            <stepper-button-group
              :step="2"
              :next-enabled="validStep2"
              @stepChanged="dialogStep = $event"
            />
          </v-stepper-content>

          <v-stepper-step
            :complete="dialogStep > 3"
            step="3"
          >
            Meta-Data
          </v-stepper-step>
          <v-stepper-content step="3">
            <pipeline-metadata-config
              v-model="dialogPipeline.metadata"
              @validityChanged="validStep3 = $event"
            />
          </v-stepper-content>
        </v-stepper>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="error"
          class="ma-2"
          @click="onCancel"
        >
          Cancel
        </v-btn>
        <v-btn
          v-if="isEditMode"
          :disabled="!evaluateAllForms()"
          color="primary"
          class="ma-2"
          @click="onUpdate"
        >
          Update
        </v-btn>
        <v-btn
          v-else
          :disabled="!evaluateAllForms()"
          color="primary"
          class="ma-2"
          @click="onSave"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Watch } from 'vue-property-decorator'
import { Action, State } from 'vuex-class'

import Pipeline from '@/pipeline/pipeline'
import StepperButtonGroup from '@/components/StepperButtonGroup.vue'
import PipelineMetadataConfig from '@/pipeline/edit/PipelineMetadataConfig.vue'
import PipelineTransformationConfig from '@/pipeline/edit/transformation/PipelineTransformationConfig.vue'

const pipelineNamespace = { namespace: 'pipeline' }

@Component({
  components: { StepperButtonGroup, PipelineMetadataConfig, PipelineTransformationConfig }
})
export default class PipelineEdit extends Vue {
  @Action('loadPipelineById', pipelineNamespace) private loadPipelineByIdAction!: (id: number) => void
  @Action('createPipeline', pipelineNamespace) private createPipelineAction!: (p: Pipeline) => void
  @Action('updatePipeline', pipelineNamespace) private updatePipelineAction!: (p: Pipeline) => void
  @State('selectedPipeline', pipelineNamespace) private selectedPipeline!: Pipeline

  private isEditMode = false
  private isDatasourcePreselected = false

  private dialogStep = 1

  private validStep1 = false
  private validStep2 = false // need to execute
  private validStep3 = true // starts with valid default values

  private dialogPipeline: Pipeline = {
    id: -1,
    datasourceId: -1,
    transformation: { func: "data.test = 'abc';\nreturn data;" },
    metadata: {
      author: '',
      license: '',
      description: '',
      displayName: ''
    }
  }

  created (): void {
    this.isEditMode = this.$route.meta.isEditMode

    if (this.isEditMode) {
      const id = parseInt(this.$route.params.pipelineId)
      this.loadPipelineByIdAction(id)
    } else {
      const datasourceId = this.$route.params.datasourceId
      if (datasourceId) {
        this.isDatasourcePreselected = true
        this.dialogPipeline.datasourceId = parseInt(datasourceId)
      }
    }
  }

  @Watch('selectedPipeline')
  onSelectedPipelineChange (value: Pipeline, oldValue: Pipeline): void {
    if (value != oldValue) {
      this.dialogPipeline = value
    }
  }

  private onSave (): void {
    this.createPipelineAction(this.dialogPipeline)
    this.routeToOverview()
  }

  private onUpdate (): void {
    this.updatePipelineAction(this.dialogPipeline)
    this.routeToOverview()
  }

  private onCancel (): void {
    this.routeToOverview()
  }

  private routeToOverview (): void {
    this.$router.push({ name: 'pipeline-overview' })
  }

  private required (val: string): boolean | string {
    return !!val || 'required.'
  }

  private evaluateAllForms (): boolean {
    return this.validStep1 &&
        this.validStep2 &&
        this.validStep3
  }
}
</script>
