// +build !

// This file was autogenerated by openapi-gen. Do not edit it manually!

package v1alpha1

import (
	spec "github.com/go-openapi/spec"
	common "k8s.io/kube-openapi/pkg/common"
)

func GetOpenAPIDefinitions(ref common.ReferenceCallback) map[string]common.OpenAPIDefinition {
	return map[string]common.OpenAPIDefinition{
		"./pkg/apis/storage/v1alpha1.PersistentVolumeTemplateSpec": schema_pkg_apis_storage_v1alpha1_PersistentVolumeTemplateSpec(ref),
		"./pkg/apis/storage/v1alpha1.Volume":                       schema_pkg_apis_storage_v1alpha1_Volume(ref),
		"./pkg/apis/storage/v1alpha1.VolumeSpec":                   schema_pkg_apis_storage_v1alpha1_VolumeSpec(ref),
		"./pkg/apis/storage/v1alpha1.VolumeStatus":                 schema_pkg_apis_storage_v1alpha1_VolumeStatus(ref),
	}
}

func schema_pkg_apis_storage_v1alpha1_PersistentVolumeTemplateSpec(ref common.ReferenceCallback) common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{
			SchemaProps: spec.SchemaProps{
				Description: "Describes the PersistentVolume that will be created to back the Volume.",
				Properties: map[string]spec.Schema{
					"metadata": {
						SchemaProps: spec.SchemaProps{
							Description: "Standard object's metadata.",
							Ref:         ref("k8s.io/apimachinery/pkg/apis/meta/v1.ObjectMeta"),
						},
					},
					"spec": {
						SchemaProps: spec.SchemaProps{
							Description: "Specification of the Persistent Volume.",
							Ref:         ref("k8s.io/api/core/v1.PersistentVolumeSpec"),
						},
					},
				},
			},
		},
		Dependencies: []string{
			"k8s.io/api/core/v1.PersistentVolumeSpec", "k8s.io/apimachinery/pkg/apis/meta/v1.ObjectMeta"},
	}
}

func schema_pkg_apis_storage_v1alpha1_Volume(ref common.ReferenceCallback) common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{
			SchemaProps: spec.SchemaProps{
				Description: "Volume is the Schema for the volumes API",
				Properties: map[string]spec.Schema{
					"kind": {
						SchemaProps: spec.SchemaProps{
							Description: "Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/api-conventions.md#types-kinds",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"apiVersion": {
						SchemaProps: spec.SchemaProps{
							Description: "APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/api-conventions.md#resources",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"metadata": {
						SchemaProps: spec.SchemaProps{
							Ref: ref("k8s.io/apimachinery/pkg/apis/meta/v1.ObjectMeta"),
						},
					},
					"spec": {
						SchemaProps: spec.SchemaProps{
							Ref: ref("./pkg/apis/storage/v1alpha1.VolumeSpec"),
						},
					},
					"status": {
						SchemaProps: spec.SchemaProps{
							Ref: ref("./pkg/apis/storage/v1alpha1.VolumeStatus"),
						},
					},
				},
			},
		},
		Dependencies: []string{
			"./pkg/apis/storage/v1alpha1.VolumeSpec", "./pkg/apis/storage/v1alpha1.VolumeStatus", "k8s.io/apimachinery/pkg/apis/meta/v1.ObjectMeta"},
	}
}

func schema_pkg_apis_storage_v1alpha1_VolumeSpec(ref common.ReferenceCallback) common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{
			SchemaProps: spec.SchemaProps{
				Description: "VolumeSpec defines the desired state of Volume",
				Properties: map[string]spec.Schema{
					"nodeName": {
						SchemaProps: spec.SchemaProps{
							Description: "Name of the node on which the volume is available.",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"storageClassName": {
						SchemaProps: spec.SchemaProps{
							Description: "Name of the StorageClass that gets assigned to the volume. Also, any mount options are copied from the StorageClass to the PersistentVolume if present.",
							Type:        []string{"string"},
							Format:      "",
						},
					},
					"template": {
						SchemaProps: spec.SchemaProps{
							Description: "Template for the underlying PersistentVolume.",
							Ref:         ref("./pkg/apis/storage/v1alpha1.PersistentVolumeTemplateSpec"),
						},
					},
					"sparseLoopDevice": {
						SchemaProps: spec.SchemaProps{
							Ref: ref("./pkg/apis/storage/v1alpha1.SparseLoopDeviceVolumeSource"),
						},
					},
					"rawBlockDevice": {
						SchemaProps: spec.SchemaProps{
							Ref: ref("./pkg/apis/storage/v1alpha1.RawBlockDeviceVolumeSource"),
						},
					},
				},
				Required: []string{"nodeName", "storageClassName"},
			},
		},
		Dependencies: []string{
			"./pkg/apis/storage/v1alpha1.PersistentVolumeTemplateSpec", "./pkg/apis/storage/v1alpha1.RawBlockDeviceVolumeSource", "./pkg/apis/storage/v1alpha1.SparseLoopDeviceVolumeSource"},
	}
}

func schema_pkg_apis_storage_v1alpha1_VolumeStatus(ref common.ReferenceCallback) common.OpenAPIDefinition {
	return common.OpenAPIDefinition{
		Schema: spec.Schema{
			SchemaProps: spec.SchemaProps{
				Description: "VolumeStatus defines the observed state of Volume",
				Properties: map[string]spec.Schema{
					"conditions": {
						SchemaProps: spec.SchemaProps{
							Description: "List of conditions through which the Volume has or has not passed.",
							Type:        []string{"array"},
							Items: &spec.SchemaOrArray{
								Schema: &spec.Schema{
									SchemaProps: spec.SchemaProps{
										Ref: ref("./pkg/apis/storage/v1alpha1.VolumeCondition"),
									},
								},
							},
						},
					},
					"job": {
						SchemaProps: spec.SchemaProps{
							Description: "Job in progress",
							Type:        []string{"string"},
							Format:      "",
						},
					},
				},
			},
		},
		Dependencies: []string{
			"./pkg/apis/storage/v1alpha1.VolumeCondition"},
	}
}
