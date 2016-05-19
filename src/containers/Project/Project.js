/*  global Choose, When, Otherwise */

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import TimeAgo from 'react-timeago';
import { asyncConnect } from 'redux-connect';
import { isCached, load, refresh } from 'redux/modules/repository';

import RaisedButton from 'material-ui/RaisedButton';
import IconButton from 'material-ui/IconButton';
import AlertError from 'material-ui/svg-icons/alert/error';
import HardwareKeyboardArrowRight from 'material-ui/svg-icons/hardware/keyboard-arrow-right';
import ActionCached from 'material-ui/svg-icons/action/cached';

import { palette } from '../../theme';
import * as config from '../../config';

import {
  ProjectHeader,
  ProjectCardList,
  ProjectLoadingScreen,
  ProjectChartList
} from 'components';

import styles from './Project.css';

const createHandlers = function handlers(dispatch, repository) {
  const refreshOnClick = function onClick() {
    dispatch(refresh(repository));
  };
  return {
    refreshOnClick,
  };
};

@asyncConnect([{
  promise: ({store: {dispatch, getState}}) => {
    const repository = getState().repository;
    if (__SERVER__) {
      return dispatch(isCached(repository)).then((res) => {
        if (res.data === true) {
          return dispatch(load(repository));
        }
      });
    }
  }
}])
@connect(
  state => ({
    repository: state.repository,
    results: state.repository.results,
    loading: state.repository.loading
  }
), {refresh})
export default class Project extends Component {
  static propTypes = {
    repository: PropTypes.object.isRequired,
    results: PropTypes.object,
    loading: PropTypes.bool
  };

  constructor(props) {
    super(props);

    this.state = {
      showCharts: false,
    };

    // Load the data if not done yet
    const { dispatch } = this.props; // eslint-disable-line react/prop-types
    this.handlers = createHandlers(dispatch, this.props.repository);
    if (!this.props.repository.loaded) {
      dispatch(load(this.props.repository));
    }
  }

  getLoadingDuration() {
    const executionTime = this.props.results.executionTime;
    if (!executionTime) {
      return 0;
    }
    return parseInt(executionTime, 10);
  }

  showCharts = () => {
    this.setState({
      showCharts: true
    });
  }

  render() {
    const buttonStyle = {
      height: 50,
      width: '100%'
    };
    const labelStyle = {
      color: palette.alternateTextColor,
      fontSize: 20,
      fontWeight: 400,
      letterSpacing: 0.5,
      WebkitFontSmoothing: 'antialiased'
    };
    const tooltipStyle = {
      zIndex: 500
    };
    const bigIconStyle = {
      width: 48,
      height: 48
    };
    return (
      <div>
        <Helmet title={`Code Quality Report for ${this.props.repository.name}`}/>
        <ProjectHeader repository={this.props.repository.name} />
        <Choose>
          <When condition={ this.props.loading }>
            <ProjectLoadingScreen duration={this.getLoadingDuration()} />
          </When>
          <When condition={ this.props.repository.error }>
            <div className={styles.errorMessage}>
              <AlertError style={bigIconStyle} />
              <p className={styles.errorMessage__text}>
                Something went wrong!<br />
                {this.props.repository.error.message}
              </p>
            </div>
          </When>
          <Otherwise>
            <div>
              <div className={styles.badge}>
                <img src={`http://${config.apiHost}:${config.apiPort}/badge/${this.props.repository.name}`} />
              </div>
              <div className={styles.update}>
                <span className={styles.update__text}>Updated <TimeAgo date={this.props.results.date} /></span>
                <IconButton tooltip="Refresh Statistics" tooltipPosition="bottom-center" style={tooltipStyle} onClick={this.handlers.refreshOnClick}>
                  <ActionCached color={palette.disabledColor} hoverColor={palette.textColor}/>
                </IconButton>
              </div>
              <ProjectCardList data={this.props.results} />
              <Choose>
                <When condition={ this.state.showCharts }>
                  <ProjectChartList data={this.props.results} />
                </When>
                <Otherwise>
                  <RaisedButton
                    label="Explore"
                    backgroundColor={palette.primary1Color}
                    style={buttonStyle}
                    labelStyle={labelStyle}
                    icon={<HardwareKeyboardArrowRight />}
                    primary
                    onClick={this.showCharts} />
                </Otherwise>
              </Choose>
            </div>
          </Otherwise>
        </Choose>
      </div>
    );
  }
}
