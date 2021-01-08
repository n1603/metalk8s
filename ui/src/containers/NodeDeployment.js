import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import ReactJson from 'react-json-view';
import { useRouteMatch, useHistory } from 'react-router';
import isEmpty from 'lodash.isempty';
import { Button, Loader, Steppers } from '@scality/core-ui';
import {
  fontWeight,
  grayLighter,
  padding,
  fontSize,
} from '@scality/core-ui/dist/style/theme';

import { intl } from '../translations/IntlGlobalProvider';

const NodeDeploymentContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: ${padding.larger};
  overflow: auto;
`;

const InfoMessage = styled.div`
  color: ${(props) => props.theme.brand.textPrimary};
  font-size: ${fontSize.base};
  padding: ${padding.base};
`;

const NodeDeploymentTitle = styled.div`
  color: ${(props) => props.theme.brand.textPrimary};
  font-weight: ${fontWeight.bold};
  font-size: ${fontSize.large};
  margin: ${padding.base};
`;

const NodeDeploymentEvent = styled.div`
  background-color: ${grayLighter};
  color: ${(props) => props.theme.brand.textPrimary};
  padding: ${padding.base};
  margin: ${padding.base};
  border-radius: 5px;
  display: flex;
  flex-grow: 1;
`;

const NodeDeploymentContent = styled.div`
  display: flex;
`;

const NodeDeploymentWrapper = styled.div`
  padding: ${padding.base};
`;

const NodeDeploymentStatus = styled.div`
  padding: ${padding.larger};
  width: 400px;
`;

const ErrorLabel = styled.span`
  color: ${(props) => props.theme.brand.danger};
`;

const NodeDeployment = () => {
  const history = useHistory();
  const match = useRouteMatch();
  const nodeName = match?.params?.id;

  const jobs = useSelector((state) =>
    state.app.salt.jobs.filter(
      (job) => job.type === 'deploy-node' && job.node === nodeName,
    ),
  );

  let activeJob = jobs.find((job) => !job.completed);
  if (activeJob === undefined) {
    // Pick most recent one
    const sortedJobs = jobs.sort(
      (jobA, jobB) => Date(jobA.completedAt) >= Date(jobB.completedAt),
    );
    activeJob = sortedJobs[0];
  }

  let steps = [{ title: intl.translate('node_registered') }];
  let success = false;
  if (activeJob) {
    if (activeJob.events.find((event) => event.tag.includes('/new'))) {
      steps.push({ title: intl.translate('deployment_started') });
    }

    if (activeJob.completed) {
      const status = activeJob.status;
      steps.push({
        title: intl.translate('completed'),
        content: (
          <span>
            {!status.success && (
              <ErrorLabel>
                {`${intl.translate('error')}: ${status.step} - ${
                  status.comment
                }`}
              </ErrorLabel>
            )}
          </span>
        ),
      });
      success = status.success;
    } else {
      steps.push({
        title: intl.translate('deploying'),
        content: <Loader size="larger" />,
      });
    }
  }

  // TODO: Remove this workaround and actually handle showing a failed step
  //       in the Steppers component
  const activeStep = success ? steps.length : steps.length - 1;

  return (
    <NodeDeploymentContainer>
      <div>
        <Button
          text={intl.translate('back_to_node_list')}
          type="button"
          outlined
          onClick={() => history.push('/nodes')}
          icon={<i className="fas fa-arrow-left" />}
        />
      </div>
      <NodeDeploymentWrapper>
        <NodeDeploymentTitle>
          {intl.translate('node_deployment')}
        </NodeDeploymentTitle>
        {activeJob === undefined ? (
          <InfoMessage>
            {intl.translate('no_deployment_found', { name: nodeName })}
          </InfoMessage>
        ) : activeJob.completed && isEmpty(activeJob.status) ? (
          <InfoMessage>{intl.translate('refreshing_job')}</InfoMessage>
        ) : (
          <NodeDeploymentContent>
            <NodeDeploymentStatus>
              <Steppers steps={steps} activeStep={activeStep} />
            </NodeDeploymentStatus>
            <NodeDeploymentEvent>
              <ReactJson
                src={activeJob.events}
                name={nodeName}
                collapsed={true}
              />
            </NodeDeploymentEvent>
          </NodeDeploymentContent>
        )}
      </NodeDeploymentWrapper>
    </NodeDeploymentContainer>
  );
};

export default NodeDeployment;
