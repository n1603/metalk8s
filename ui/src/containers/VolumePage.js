import React, { useEffect } from 'react';
import { useRouteMatch } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import VolumeContent from './VolumePageContent';
import { fetchPodsAction } from '../ducks/app/pods';
import { refreshNodesAction, stopRefreshNodesAction } from '../ducks/app/nodes';
import {
  refreshAlertManagerAction,
  stopRefreshAlertManagerAction,
} from '../ducks/app/alerts';
import { makeGetNodeFromUrl, useRefreshEffect } from '../services/utils';
import { fetchNodesAction } from '../ducks/app/nodes';
import {
  refreshVolumesAction,
  stopRefreshVolumesAction,
  refreshPersistentVolumesAction,
  stopRefreshPersistentVolumesAction,
  fetchPersistentVolumeClaimAction,
  fetchCurrentVolumeObjectAction,
} from '../ducks/app/volumes';
import {
  fetchVolumeStatsAction,
  fetchCurrentVolumeStatsAction,
  refreshCurrentVolumeStatsAction,
  stopRefreshCurrentVolumeStatsAction,
} from '../ducks/app/monitoring';
import { getVolumeListData } from '../services/NodeVolumesUtils';
import { PageContainer } from '../components/CommonLayoutStyle';

// <VolumePage> component fetchs all the data used by volume page from redux store.
// the data for <VolumeMetricGraphCard>: get the default metrics time span `last 24 hours`, and the component itself can change the time span base on the dropdown selection.
// <VolumeContent> component extracts the current volume name from URL and sends volume specific data to sub components.
const VolumePage = (props) => {
  const dispatch = useDispatch();
  const match = useRouteMatch();
  const currentVolumeName = match.params.name;

  useEffect(() => {
    if (currentVolumeName)
      dispatch(fetchCurrentVolumeObjectAction(currentVolumeName));
  }, [dispatch, currentVolumeName]);

  useRefreshEffect(refreshNodesAction, stopRefreshNodesAction);
  useRefreshEffect(refreshVolumesAction, stopRefreshVolumesAction);
  useRefreshEffect(
    refreshPersistentVolumesAction,
    stopRefreshPersistentVolumesAction,
  );
  useRefreshEffect(
    refreshCurrentVolumeStatsAction,
    stopRefreshCurrentVolumeStatsAction,
  );

  useEffect(() => {
    dispatch(fetchPodsAction());
    dispatch(fetchNodesAction());
    dispatch(fetchVolumeStatsAction());
    dispatch(fetchCurrentVolumeStatsAction());
    dispatch(fetchPersistentVolumeClaimAction());
  }, [dispatch]);

  useRefreshEffect(refreshAlertManagerAction, stopRefreshAlertManagerAction);

  // get all the pods for all the nodes
  const pods = useSelector((state) => state.app.pods.list);
  const node = useSelector((state) => makeGetNodeFromUrl(state, props));
  const nodes = useSelector((state) => state.app.nodes.list);
  const volumes = useSelector((state) => state.app.volumes.list);
  const volumesLoading = useSelector((state) => state.app.volumes.isLoading);
  const currentVolumeObject = useSelector(
    (state) => state.app.volumes.currentVolumeObject,
  );
  const pVList = useSelector((state) => state.app.volumes.pVList);
  /*
   ** The PVCs list is used to check when the alerts will be mapped to the corresponding volumes
   ** in order to auto select the volume when all the data are there.
   */
  const pVCList = useSelector((state) => state?.app?.volumes?.pVCList);
  const alerts = useSelector((state) => state.app.alerts);

  const volumeStats = useSelector(
    (state) => state.app.monitoring.volumeStats.metrics,
  );
  // get all the volumes maybe filter by node
  const volumeListData = useSelector((state) =>
    getVolumeListData(state, props),
  );

  return (
    <PageContainer>
      <VolumeContent
        volumes={volumes}
        volumeListData={volumeListData}
        nodes={nodes}
        node={node}
        pVList={pVList}
        pVCList={pVCList}
        pods={pods}
        alerts={alerts}
        volumeStats={volumeStats}
        currentVolumeObject={currentVolumeObject}
        loading={volumesLoading}
      ></VolumeContent>
    </PageContainer>
  );
};

export default VolumePage;
