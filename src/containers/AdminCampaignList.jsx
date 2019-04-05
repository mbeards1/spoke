import PropTypes from 'prop-types'
import React from 'react'
import CampaignList from './CampaignList'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'
import ArchiveIcon from 'material-ui/svg-icons/content/archive'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import loadData from './hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import theme from '../styles/theme'
import LoadingIndicator from '../components/LoadingIndicator'
import wrapMutations from './hoc/wrap-mutations'
import DropDownMenu from 'material-ui/DropDownMenu'
import IconMenu from 'material-ui/IconMenu';
import { MenuItem } from 'material-ui/Menu'
import { dataTest } from '../lib/attributes'
import IconButton from 'material-ui/IconButton/IconButton';

class AdminCampaignList extends React.Component {
  state = {
    isCreating: false,
    campaignsFilter: {
      isArchived: false,
      listSize: 0
    },
    archiveMultiple: false,
    campaignsToArchive: {}
  }

  handleClickNewButton = async () => {
    const { organizationId } = this.props.params
    this.setState({ isCreating: true })
    const newCampaign = await this.props.mutations.createCampaign({
      title: 'New Campaign',
      description: '',
      dueBy: null,
      organizationId,
      contacts: [],
      interactionSteps: {
        script: ''
      }
    })
    if (newCampaign.errors) {
      alert('There was an error creating your campaign')
      throw new Error(newCampaign.errors)
    }

    this.props.router.push(
      `/admin/${organizationId}/campaigns/${newCampaign.data.createCampaign.id}/edit?new=true`
    )
  }

  handleClickArchiveButton = () => {
    const campaignIds = Object.entries(this.state.campaignsToArchive)
      .reduce((arr, [id, checked]) => {
        if (checked) {
          arr.push(id)
          return arr
        }
        return arr
      }, [])
    console.log(campaignIds)
  }

  handleFilterChange = (event, index, value) => {
    this.setState({
      campaignsFilter: {
        isArchived: value,
        listSize: this.state.campaignsFilter.listSize
      }
    })
  }

  handleListSizeChange = (event, index, value) => {
    this.setState({
      campaignsFilter: {
        isArchived: this.state.campaignsFilter.isArchived,
        listSize: value
      }
    })
  }

  handleChecked = ({ campaignId, checked }) => {
    const { campaignsToArchive } = this.state
    // checked has to be reversed here because the onTouchTap
    // event fires before the input is checked.
    campaignsToArchive[campaignId] = !checked
    this.setState({ campaignsToArchive })
  }

  renderListSizeOptions() {
    return (
      <DropDownMenu value={this.state.campaignsFilter.listSize} onChange={this.handleListSizeChange} >
        <MenuItem value={10} primaryText='10' />
        <MenuItem value={25} primaryText='25' />
        <MenuItem value={50} primaryText='50' />
        <MenuItem value={100} primaryText='100' />
        <MenuItem value={0} primaryText='All' />
      </DropDownMenu>
    )
  }

  renderFilters() {
    return (
      <DropDownMenu value={this.state.campaignsFilter.isArchived} onChange={this.handleFilterChange}>
        <MenuItem value={false} primaryText='Current' />
        <MenuItem value primaryText='Archived' />
      </DropDownMenu>
    )
  }

  renderArchiveMultiple() {
    return (
      <IconMenu
        iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
      >
        {this.state.archiveMultiple ?
          <MenuItem
            primaryText='Cancel'
            onClick={() => { this.setState({ archiveMultiple: false }) }}
          />
          :
          <MenuItem
            primaryText='Archive multiple campaigns'
            onClick={() => { this.setState({ archiveMultiple: true }) }}
          />
        }

      </IconMenu>
    )
  }

  renderActionButton() {
    if (this.state.archiveMultiple) {
      return (
        <FloatingActionButton
          {...dataTest('archiveCampaigns')}
          style={theme.components.floatingButton}
          onTouchTap={this.handleClickArchiveButton}
        >
          <ArchiveIcon />
        </FloatingActionButton>
      )
    }
    return (
      <FloatingActionButton
        {...dataTest('addCampaign')}
        style={theme.components.floatingButton}
        onTouchTap={this.handleClickNewButton}
      >
        <ContentAdd />
      </FloatingActionButton>
    )
  }

  render() {
    const { adminPerms } = this.props.params
    return (
      <div>
        {adminPerms && this.renderArchiveMultiple()}
        {!this.state.archiveMultiple && this.renderFilters()}
        {this.renderListSizeOptions()}
        {this.state.isCreating ? <LoadingIndicator /> : (
          <CampaignList
            campaignsFilter={this.state.campaignsFilter}
            organizationId={this.props.params.organizationId}
            adminPerms={adminPerms}
            selectMultiple={this.state.archiveMultiple}
            handleChecked={this.handleChecked}
          />
        )}

        {adminPerms && this.renderActionButton()}
      </div>
    )
  }
}

AdminCampaignList.propTypes = {
  params: PropTypes.object,
  mutations: PropTypes.object,
  router: PropTypes.object
}

const mapMutationsToProps = () => ({
  createCampaign: (campaign) => ({
    mutation: gql`
      mutation createBlankCampaign($campaign: CampaignInput!) {
        createCampaign(campaign: $campaign) {
          id
        }
      }
    `,
    variables: { campaign }
  })
})

export default loadData(wrapMutations(
  withRouter(AdminCampaignList)), {
    mapMutationsToProps
  })
