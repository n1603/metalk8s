import React from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import { useLocation, useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';
import {
  useTable,
  useFilters,
  useGlobalFilter,
  useAsyncDebounce,
  useSortBy,
} from 'react-table';
import { useQuery } from '../services/utils';
import { fontSize, padding } from '@scality/core-ui/dist/style/theme';
import CircleStatus from './CircleStatus';
import { Button } from '@scality/core-ui';
import { intl } from '../translations/IntlGlobalProvider';
import { compareHealth, useTableSortURLSync } from '../services/utils';
import {
  API_STATUS_READY,
  API_STATUS_NOT_READY,
  API_STATUS_UNKNOWN,
  API_STATUS_DEPLOYING,
} from '../constants';

const NodeListContainer = styled.div`
  color: ${(props) => props.theme.brand.textPrimary};
  padding: ${padding.base};
  font-family: 'Lato';
  font-size: ${fontSize.base};
  border-color: ${(props) => props.theme.brand.borderLight};
  background-color: ${(props) => props.theme.brand.primary};
  .sc-progressbarcontainer {
    width: 100%;
  }
  .ReactTable .rt-thead {
    overflow-y: auto;
  }
  table {
    border-spacing: 0;
    .sc-select-container {
      width: 120px;
      height: 10px;
    }
    tr {
      border-bottom: 5px solid ${(props) => props.theme.brand.primary};
      :last-child {
        td {
          border-bottom: 0;
          font-weight: normal;
        }
      }
    }

    th {
      font-weight: bold;
      height: 31px;
      text-align: left;
      padding: ${padding.smaller};
      cursor: pointer;
    }

    td {
      margin: 0;
      padding: ${padding.smaller};
      text-align: left;

      :last-child {
        border-right: 0;
      }
    }
  }
`;

const HeadRow = styled.tr`
  width: 100%;
  /* To display scroll bar on the table */
  display: table;
  table-layout: fixed;
`;

const CreateNodeButton = styled(Button)`
  margin-left: ${padding.larger};
`;

const TableRow = styled(HeadRow)`
  height: 76px;
  border-radius: 10px;
  &:hover,
  &:focus {
    background-color: ${(props) => props.theme.brand.backgroundBluer};
    border-top: 1px solid ${(props) => props.theme.brand.secondary};
    border-bottom: 1px solid ${(props) => props.theme.brand.secondary};
    outline: none;
    cursor: pointer;
  }

  background-color: ${(props) =>
    props.selectedNodeName === props.row.values.name.name
      ? props.theme.brand.backgroundBluer
      : props.theme.brand.background};
`;

// * table body
const Body = styled.tbody`
  /* To display scroll bar on the table */
  display: block;
  height: calc(100vh - 186px);
  overflow: auto;
  overflow-y: auto;
`;

const Cell = styled.td`
  overflow-wrap: break-word;
`;

const ActionContainer = styled.span`
  display: flex;
  justify-content: space-between;
`;

const NodeNameText = styled.div`
  font-size: ${fontSize.large};
`;

const IPText = styled.span`
  font-size: ${fontSize.smaller};
  padding-right: ${padding.small};
  color: ${(props) => props.theme.brand.textSecondary};
`;

const StatusText = styled.div`
  color: ${(props) => {
    return props.textColor;
  }};
`;

export const SortCaretWrapper = styled.span`
  padding-left: ${padding.smaller};
  position: absolute;
`;

export const SortIncentive = styled.span`
  position: absolute;
  display: none;
`;

export const TableHeader = styled.th`
  &:hover {
    ${SortIncentive} {
      display: block;
    }
  }
`;

function GlobalFilter({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
  theme,
}) {
  const [value, setValue] = React.useState(globalFilter);
  const history = useHistory();
  const location = useLocation();
  const onChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined);

    // update the URL with the content of search
    const searchParams = new URLSearchParams(location.search);
    const isSearch = searchParams.has('search');
    if (!isSearch) {
      searchParams.append('search', value);
    } else {
      searchParams.set('search', value);
    }
    history.push(`?${searchParams.toString()}`);
  }, 500);

  return (
    <ActionContainer>
      <input
        value={value || undefined}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={`Search`}
        style={{
          fontSize: '1.1rem',
          color: theme.brand.textPrimary,
          border: 'solid 1px #3b4045',
          width: '223px',
          height: '27px',
          borderRadius: '4px',
          backgroundColor: theme.brand.primaryDark2,
          fontFamily: 'Lato',
          fontStyle: 'italic',
          opacity: '0.6',
          lineHeight: '1.43',
          letterSpacing: 'normal',
          paddingLeft: '10px',
        }}
        data-cy="node_list_search"
      />
      <CreateNodeButton
        size="small"
        variant="secondary"
        text={intl.translate('create_new_node')}
        icon={<i className="fas fa-plus-circle"></i>}
        onClick={() => {
          history.push('/nodes/create');
        }}
        data-cy="create_node_button"
      />
    </ActionContainer>
  );
}

function Table({ columns, data, rowClicked, theme, selectedNodeName }) {
  const query = useQuery();
  const querySearch = query.get('search');
  const querySort = query.get('sort');
  const queryDesc = query.get('desc');

  // Use the state and functions returned from useTable to build your UI
  const defaultColumn = React.useMemo(
    () => ({
      Filter: GlobalFilter,
    }),
    [],
  );

  const sortTypes = React.useMemo(() => {
    return {
      health: (row1, row2) => {
        return compareHealth(
          row2?.values?.health?.health,
          row1?.values?.health?.health,
        );
      },
      status: (row1, row2) => {
        const weights = {};
        weights[API_STATUS_READY] = 3;
        weights[API_STATUS_NOT_READY] = 2;
        weights[API_STATUS_DEPLOYING] = 1;
        weights[API_STATUS_UNKNOWN] = 0;

        return (
          weights[row1?.values?.status?.status] -
          weights[row2?.values?.status?.status]
        );
      },
      name: (row1, row2) => {
        const a = row1?.values?.name?.name;
        const b = row2.values?.name?.name;
        return a.toLowerCase().localeCompare(b.toLowerCase());
      },
    };
  }, []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    visibleColumns,
    preGlobalFilteredRows,
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      initialState: {
        globalFilter: querySearch,
        sortBy: [
          {
            id: querySort || 'health',
            desc: queryDesc || false,
          },
        ],
      },
      disableMultiSort: true,
      autoResetSortBy: false,
      sortTypes,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
  );

  // Synchronizes the params query with the Table sort state
  const sorted = headerGroups[0].headers.find((item) => item.isSorted === true)
    ?.id;
  const desc = headerGroups[0].headers.find((item) => item.isSorted === true)
    ?.isSortedDesc;
  useTableSortURLSync(sorted, desc, data);

  return (
    <>
      <table {...getTableProps()}>
        <thead>
          {/* The first row should be the search bar */}
          <tr>
            <th
              colSpan={visibleColumns.length}
              style={{
                textAlign: 'left',
              }}
            >
              <GlobalFilter
                preGlobalFilteredRows={preGlobalFilteredRows}
                globalFilter={state.globalFilter}
                setGlobalFilter={setGlobalFilter}
                theme={theme}
              />
            </th>
          </tr>
          {headerGroups.map((headerGroup) => {
            return (
              <HeadRow {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => {
                  const headerStyleProps = column.getHeaderProps(
                    Object.assign(column.getSortByToggleProps(), {
                      style: column.cellStyle,
                    }),
                  );
                  return (
                    <TableHeader {...headerStyleProps} className="th">
                      {column.render('Header')}
                      <SortCaretWrapper>
                        {column.isSorted ? (
                          column.isSortedDesc ? (
                            <i className="fas fa-sort-down" />
                          ) : (
                            <i className="fas fa-sort-up" />
                          )
                        ) : (
                          <SortIncentive>
                            <i className="fas fa-sort" />
                          </SortIncentive>
                        )}
                      </SortCaretWrapper>
                    </TableHeader>
                  );
                })}
              </HeadRow>
            );
          })}
        </thead>
        <Body {...getTableBodyProps()}>
          {rows.length === 0 ? (
            <HeadRow
              style={{
                width: '100%',
                paddingTop: padding.base,
                height: '60px',
              }}
            >
              <td
                style={{
                  textAlign: 'center',
                  background: theme.brand.primary,
                }}
              >
                {intl.translate('no_node_found')}
              </td>
            </HeadRow>
          ) : null}

          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <TableRow
                {...row.getRowProps({ onClick: () => rowClicked(row) })}
                row={row}
                selectedNodeName={selectedNodeName}
              >
                {row.cells.map((cell) => {
                  let cellProps = cell.getCellProps({
                    style: {
                      ...cell.column.cellStyle,
                    },
                  });
                  if (cell.column.Header === 'Name') {
                    return (
                      <Cell {...cellProps}>
                        <NodeNameText data-cy="node_table_name_cell">
                          {cell.value.name}
                        </NodeNameText>
                        <div>
                          {cell.value.controlPlaneIP ? (
                            <IPText>CP: {cell.value.controlPlaneIP}</IPText>
                          ) : null}
                          {cell.value.workloadPlaneIP ? (
                            <IPText>WP: {cell.value.workloadPlaneIP}</IPText>
                          ) : null}
                        </div>
                      </Cell>
                    );
                  } else if (cell.value === intl.translate('unknown')) {
                    return (
                      <Cell {...cellProps}>
                        <div>{intl.translate('unknown')}</div>
                      </Cell>
                    );
                  } else {
                    return <Cell {...cellProps}>{cell.render('Cell')}</Cell>;
                  }
                })}
              </TableRow>
            );
          })}
        </Body>
      </table>
    </>
  );
}

const NodeListTable = (props) => {
  const { nodeTableData } = props;
  const history = useHistory();
  const location = useLocation();
  const query = useQuery();

  const { path } = useRouteMatch();
  const theme = useSelector((state) => state.config.theme);

  const selectedNodeName =
    history?.location?.pathname?.split('/')?.slice(2)[0] || '';
  const columns = React.useMemo(
    () => [
      {
        Header: 'Health',
        accessor: 'health',
        cellStyle: { textAlign: 'center', width: '70px' },
        Cell: (cellProps) => {
          const { health } = cellProps.value;
          return <CircleStatus status={health} />;
        },
        sortType: 'health',
      },
      {
        Header: 'Name',
        accessor: 'name',
        cellStyle: { width: '180px' },
        sortType: 'name',
      },
      {
        Header: 'Roles',
        accessor: 'roles',
      },
      {
        Header: 'Status',
        accessor: 'status',
        cellStyle: { textAlign: 'center', width: '80px' },
        Cell: (cellProps) => {
          const { statusTextColor, computedStatus } = cellProps.value;
          return computedStatus.map((status) => {
            return (
              <StatusText key={status} textColor={statusTextColor}>
                {intl.translate(`${status}`)}
              </StatusText>
            );
          });
        },
        sortType: 'status',
      },
    ],
    [],
  );

  // handle the row selection by updating the URL
  const onClickRow = (row) => {
    const nodeName = row.values.name.name;

    const isTabSelected =
      location.pathname.endsWith('overview') ||
      location.pathname.endsWith('alerts') ||
      location.pathname.endsWith('metrics') ||
      location.pathname.endsWith('volumes') ||
      location.pathname.endsWith('pods') ||
      location.pathname.endsWith('details');

    if (isTabSelected) {
      const newPath = location.pathname.replace(
        /\/nodes\/[^/]*\//,
        `/nodes/${nodeName}/`,
      );
      history.push({
        pathname: newPath,
        search: query.toString(),
      });
    } else {
      history.push({
        pathname: `${path}/${nodeName}/overview`,
        search: query.toString(),
      });
    }
  };

  return (
    <NodeListContainer>
      <Table
        columns={columns}
        data={nodeTableData}
        rowClicked={onClickRow}
        theme={theme}
        selectedNodeName={selectedNodeName}
      />
    </NodeListContainer>
  );
};

export default NodeListTable;
