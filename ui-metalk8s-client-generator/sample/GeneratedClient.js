//@flow
import { customObjects } from "./api";
export type Result<T> = T | { error: any };

export type Metalk8sV1alpha1Volume = {
  apiVersion?: string,
  kind?: string,
  metadata?: {},
  spec?: {
    mode?: "Filesystem" | "Block",
    nodeName: string,
    rawBlockDevice?: { devicePath: string },
    sparseLoopDevice?: { size: number | string },
    storageClassName: string,
    template?: {
      metadata?: {},
      spec?: {
        accessModes?: Array<string>,
        awsElasticBlockStore?: {
          fsType?: string,
          partition?: number,
          readOnly?: boolean,
          volumeID: string,
        },
        azureDisk?: {
          cachingMode?: string,
          diskName: string,
          diskURI: string,
          fsType?: string,
          kind?: string,
          readOnly?: boolean,
        },
        azureFile?: {
          readOnly?: boolean,
          secretName: string,
          secretNamespace?: string,
          shareName: string,
        },
        capacity?: {},
        cephfs?: {
          monitors: Array<string>,
          path?: string,
          readOnly?: boolean,
          secretFile?: string,
          secretRef?: { name?: string, namespace?: string },
          user?: string,
        },
        cinder?: {
          fsType?: string,
          readOnly?: boolean,
          secretRef?: { name?: string, namespace?: string },
          volumeID: string,
        },
        claimRef?: {
          apiVersion?: string,
          fieldPath?: string,
          kind?: string,
          name?: string,
          namespace?: string,
          resourceVersion?: string,
          uid?: string,
        },
        csi?: {
          controllerExpandSecretRef?: { name?: string, namespace?: string },
          controllerPublishSecretRef?: { name?: string, namespace?: string },
          driver: string,
          fsType?: string,
          nodePublishSecretRef?: { name?: string, namespace?: string },
          nodeStageSecretRef?: { name?: string, namespace?: string },
          readOnly?: boolean,
          volumeAttributes?: {},
          volumeHandle: string,
        },
        fc?: {
          fsType?: string,
          lun?: number,
          readOnly?: boolean,
          targetWWNs?: Array<string>,
          wwids?: Array<string>,
        },
        flexVolume?: {
          driver: string,
          fsType?: string,
          options?: {},
          readOnly?: boolean,
          secretRef?: { name?: string, namespace?: string },
        },
        flocker?: { datasetName?: string, datasetUUID?: string },
        gcePersistentDisk?: {
          fsType?: string,
          partition?: number,
          pdName: string,
          readOnly?: boolean,
        },
        glusterfs?: {
          endpoints: string,
          endpointsNamespace?: string,
          path: string,
          readOnly?: boolean,
        },
        hostPath?: { path: string, type?: string },
        iscsi?: {
          chapAuthDiscovery?: boolean,
          chapAuthSession?: boolean,
          fsType?: string,
          initiatorName?: string,
          iqn: string,
          iscsiInterface?: string,
          lun: number,
          portals?: Array<string>,
          readOnly?: boolean,
          secretRef?: { name?: string, namespace?: string },
          targetPortal: string,
        },
        local?: { fsType?: string, path: string },
        mountOptions?: Array<string>,
        nfs?: { path: string, readOnly?: boolean, server: string },
        nodeAffinity?: {
          required?: {
            nodeSelectorTerms: Array<{
              matchExpressions?: Array<{
                key: string,
                operator: string,
                values?: Array<string>,
              }>,
              matchFields?: Array<{
                key: string,
                operator: string,
                values?: Array<string>,
              }>,
            }>,
          },
        },
        persistentVolumeReclaimPolicy?: string,
        photonPersistentDisk?: { fsType?: string, pdID: string },
        portworxVolume?: {
          fsType?: string,
          readOnly?: boolean,
          volumeID: string,
        },
        quobyte?: {
          group?: string,
          readOnly?: boolean,
          registry: string,
          tenant?: string,
          user?: string,
          volume: string,
        },
        rbd?: {
          fsType?: string,
          image: string,
          keyring?: string,
          monitors: Array<string>,
          pool?: string,
          readOnly?: boolean,
          secretRef?: { name?: string, namespace?: string },
          user?: string,
        },
        scaleIO?: {
          fsType?: string,
          gateway: string,
          protectionDomain?: string,
          readOnly?: boolean,
          secretRef: { name?: string, namespace?: string },
          sslEnabled?: boolean,
          storageMode?: string,
          storagePool?: string,
          system: string,
          volumeName?: string,
        },
        storageClassName?: string,
        storageos?: {
          fsType?: string,
          readOnly?: boolean,
          secretRef?: {
            apiVersion?: string,
            fieldPath?: string,
            kind?: string,
            name?: string,
            namespace?: string,
            resourceVersion?: string,
            uid?: string,
          },
          volumeName?: string,
          volumeNamespace?: string,
        },
        volumeMode?: string,
        vsphereVolume?: {
          fsType?: string,
          storagePolicyID?: string,
          storagePolicyName?: string,
          volumePath: string,
        },
      },
    },
  },
  status?: {
    conditions?: Array<{
      lastTransitionTime?: string,
      lastUpdateTime?: string,
      message?: string,
      reason?:
        | "Pending"
        | "Terminating"
        | "InternalError"
        | "CreationError"
        | "DestructionError"
        | "UnavailableError",
      status: "True" | "False" | "Unknown",
      type: "Ready",
    }>,
    deviceName?: string,
    job?: string,
  },
};
export type Metalk8sV1alpha1VolumeList = {
  body: { items: Metalk8sV1Alpha1Volume[] },
};

export async function getMetalk8sV1alpha1VolumeList(): Promise<
  Result<Metalk8sV1alpha1VolumeList>
> {
  if (!customObjects) {
    return { error: "customObject has not yet been initialized" };
  }
  try {
    return await customObjects.listClusterCustomObject(
      "storage.metalk8s.scality.com",
      "v1alpha1",
      "volumes"
    );
  } catch (error) {
    return { error };
  }
}

export async function deleteMetalk8sV1alpha1Volume(
  Metalk8sV1alpha1VolumeName: string
) {
  if (!customObjects) {
    return { error: "customObject has not yet been initialized" };
  }
  try {
    return await customObjects.deleteClusterCustomObject(
      "storage.metalk8s.scality.com",
      "v1alpha1",
      "volumes",
      Metalk8sV1alpha1VolumeName,
      {}
    );
  } catch (error) {
    return error;
  }
}

export async function createMetalk8sV1alpha1Volume(
  body: Metalk8sV1alpha1Volume
): Promise<Result<Metalk8sV1alpha1Volume>> {
  if (!customObjects) {
    return { error: "customObject has not yet been initialized" };
  }
  try {
    return await customObjects.createClusterCustomObject(
      "storage.metalk8s.scality.com",
      "v1alpha1",
      "volumes",
      body
    );
  } catch (error) {
    return { error };
  }
}

export async function patchMetalk8sV1alpha1Volume(
  body: $shape<Metalk8sV1alpha1Volume>
): Promise<Result<Metalk8sV1alpha1Volume>> {
  if (!customObjects) {
    return { error: "customObject has not yet been initialized" };
  }
  try {
    return await customObjects.patchClusterCustomObject(
      "storage.metalk8s.scality.com",
      "v1alpha1",
      "volumes",
      body
    );
  } catch (error) {
    return { error };
  }
}
