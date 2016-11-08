import React, { Component } from 'react'
import { map } from 'lodash'
import Modal from 'serverless-site/src/components/Modal'
// import { Link } from 'react-router'
import Select, { Creatable } from 'react-select'
import { shell } from 'electron'
import Layout from '../Layout'
import Button from '../Button'
import lambdaRegions from '../../constants/lambdaRegions'
import stages from '../../constants/stageDefaults'
import Resources from '../Resources'
import ConsoleView from '../ConsoleView'
import FunctionList from './FunctionList'
import styles from './ServiceView.css'
import {
  PATH_NOT_FOUND,
  PARSING_YAML_FAILED,
} from '../../constants/errors'

export default class ServiceView extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showInvokeModal: false,
    }
  }
  handleRunInvoke = () => {
    this.props.runInvoke(
      this.state.currentService,
      this.state.functionName,
      this.refs.eventData.value,
    )
    setTimeout(() => {
      this.hideInvokeModal()
    }, 100)
  }
  hideInvokeModal = () => {
    this.setState({ showInvokeModal: false, currentService: null })
  }
  showInvokeModal = (id, functionName) => {
    this.setState({
      showInvokeModal: !this.state.showInvokeModal,
      currentService: id,
      functionName: functionName // eslint-disable-line
    })
  }
  render() {
    const { props } = this
    const { service, credentials } = props
    if (!props.service) {
      return <div>Couldn't find this service</div>
    }
    if (service.error && service.error.type === PATH_NOT_FOUND) {
      return (
        <div>
          Couldn't find the service path anymore. In case you moved it please remove
          and re-add this service again.
        </div>
      )
    }
    if (service.error && service.error.type === PARSING_YAML_FAILED) {
      return (
        <div>
          Couldn't parse the serverless.yaml file.
        </div>
      )
    }
    const profiles = map(credentials, (value, key) => ({
      value: key,
      label: `Profile: ${key}`
    }))

    const invokeModal = (
      <Modal
        active={this.state.showInvokeModal}
        onEscKeyDown={this.hideInvokeModal}
        onOverlayClick={this.hideInvokeModal}
        title='Invoke your function with data'
      >
        <div className={styles.invokeBox}>
          <textarea ref='eventData' placeholder='enter your json here' />
        </div>
        <div className={styles.modalButtons}>
          <Button type='button' onClick={this.handleRunInvoke}>
            Invoke Function
          </Button>
          <Button onClick={this.hideInvokeModal}>
            Cancel
          </Button>
        </div>
      </Modal>
    )

    const content = (
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.serviceName}>
              {service.config.service}
            </h2>
            <div className={styles.currentServiceContext}>
              <div className={styles.currentStage}>
                <Creatable
                  name='stage'
                  options={stages}
                  clearable={false}
                  value={service.stage}
                  onChange={(entry) => props.setStageForService(entry.value, service.id)}
                  promptTextCreator={(val) => { return `Create new stage ${val}` }}
                />
              </div>
              <div className={styles.currentRegion}>
                <Select
                  name='region'
                  options={lambdaRegions}
                  clearable={false}
                  value={service.region}
                  onChange={(entry) => props.setRegionForService(entry.value, service.id)}
                  searchPromptText={'search for region'}
                />
              </div>
              <div className={styles.currentAccount}>
                <Select
                  options={profiles}
                  value={service.profile}
                  clearable={false}
                  onChange={(entry) => props.setProfileForService(entry.value, service.id)}
                />
              </div>
            </div>
            { (!service.stage || !service.region) && <span>Select a Region & Stage to deploy.</span> }
          </div>
          <div className={styles.headerRight}>
            <Button
              type='button'
              onClick={() => { props.runServiceDeploy(service.id) }}
              disabled={!service.stage || !service.region}
            >
              Deploy Service
            </Button>
          </div>
        </div>
        <div className={styles.contents}>
          <div className={styles.contentsLeft}>
            <div className={styles.serviceMeta}>
              <div>Provider: {service.config.provider.name}</div>
              <div>Runtime: {service.config.provider.runtime}</div>
              <div>
                <button onClick={() => shell.openItem(service.projectPath)}>
                  open directory
                </button>
              </div>
            </div>
            <div className={styles.serviceInfo}>
              <div className={styles.functionSection}>
                <h3 className={styles.functionHeading}>
                  Functions:
                </h3>
                <FunctionList
                  service={service}
                  runFunctionDeploy={props.runFunctionDeploy}
                  runInvoke={props.runInvoke}
                  showInvokeModal={this.showInvokeModal}
                  runLogs={props.runLogs}
                />
              </div>

              <div className={styles.resources}>
                <Resources resources={service.config.resources} />
              </div>
            </div>
          </div>

          <div className={styles.contentsRight}>
            <ConsoleView service={service} />
          </div>

        </div>
        {invokeModal}
      </div>
    )

    return <Layout content={content} />
  }
}
