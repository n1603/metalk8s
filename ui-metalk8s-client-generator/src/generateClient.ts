const YAML = require('yaml');
const fs = require('fs');
import Generator from 'openapi-to-flowtype/dist/Generator';
const prettier = require('prettier');

export const DEFAULT_PRETTIER_OPTIONS = {
  parser: 'babel',
};

export function generateClient(crdFile: string, destinationFile: string) {
  const prettierOptions = {
    ...DEFAULT_PRETTIER_OPTIONS,
    ...( prettier.resolveConfig.sync( destinationFile ) || {} )
  };
  
  const file = fs.readFileSync(crdFile, 'utf8');
  const crdSpec = YAML.parse(file);
  
  const generator = new Generator();
  
  const typePrefix = 'Metalk8s' + crdSpec.spec.version.replace(/^\w/, (c) => c.toUpperCase());
  
  const generateTypeDefinition = (typeName: string, typeDefinition) => `export type ${typeName} = ${generator.propertiesTemplate(
    generator.propertiesList( typeDefinition )
  ).replace( /"/g, '' )};`;
  
  const singleName = typePrefix + crdSpec.spec.names.kind;
  const singleType = generateTypeDefinition(singleName, crdSpec.spec.validation.openAPIV3Schema);
  
  const listName = typePrefix+crdSpec.spec.names.listKind;
  const listType = `export type ${listName} = {
    body: {items: Metalk8sV1Alpha1${crdSpec.spec.names.kind}[]};
  }`;
  
  const generatedCLient = `
  //@flow
  import { customObjects } from './api';
  export type Result<T> = T | {error: any};
  
  ${singleType}
  ${listType}
  
  export async function get${listName}(): Promise<Result<${listName}>> {
    if (!customObjects) {
      return { error: 'customObject has not yet been initialized' };
    }
    try {
      return await customObjects.listClusterCustomObject(
        '${crdSpec.spec.group}',
        '${crdSpec.spec.version}',
        '${crdSpec.spec.names.plural}',
      );
    } catch (error) {
      return { error };
    }
  }
  
  export async function delete${singleName}(${singleName}Name: string) {
    if (!customObjects) {
      return { error: 'customObject has not yet been initialized' };
    }
    try {
      return await customObjects.deleteClusterCustomObject(
        '${crdSpec.spec.group}',
        '${crdSpec.spec.version}',
        '${crdSpec.spec.names.plural}',
        ${singleName}Name,
        {},
      );
    } catch (error) {
      return error;
    }
  }
  
  export async function create${singleName}(body: ${singleName}): Promise<Result<${singleName}>> {
    if (!customObjects) {
      return { error: 'customObject has not yet been initialized' };
    }
    try {
      return await customObjects.createClusterCustomObject(
        '${crdSpec.spec.group}',
        '${crdSpec.spec.version}',
        '${crdSpec.spec.names.plural}',
        body,
      );
    } catch (error) {
      return { error };
    }
  }
  
  export async function patch${singleName}(body: $shape<${singleName}>): Promise<Result<${singleName}>> {
    if (!customObjects) {
      return { error: 'customObject has not yet been initialized' };
    }
    try {
      return await customObjects.patchClusterCustomObject(
        '${crdSpec.spec.group}',
        '${crdSpec.spec.version}',
        '${crdSpec.spec.names.plural}',
        body,
      );
    } catch (error) {
      return { error };
    }
  }
  `;
  
  return prettier.format( generatedCLient, prettierOptions );
}