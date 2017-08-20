/* global fetch */
import React, { Component } from 'react';
import { AutoSizer, Column, Table } from 'react-virtualized';
import queue from 'queue';
import { parse, format, addYears, isEqual } from 'date-fns';

const NOT_YET_ENDED = addYears(new Date(), 100);

async function fetchPage(url) {
    const resp = await fetch(url);
    const json = await resp.json();
    return json;
}

const initialState = {
    anime: [],
    isLoading: false,
    sortBy: 'canonicalTitle',
    sortDirection: 'ASC',
};

export class WatchList extends Component {
    constructor(props) {
        super(props);
        this.state = { ...initialState };
        this.fetchAnime = this.fetchAnime.bind(this);
        this.fetchShow = this.fetchShow.bind(this);
        this.initQueue = this.initQueue.bind(this);
        this.sort = this.sort.bind(this);
        this.updateSorting = this.updateSorting.bind(this);
        this._isMounted = false;
    }

    componentWillMount() {
        const { userid } = this.props;
        const firstPage = `https://kitsu.io/api/edge/users/${userid}/library-entries?filter[status]=planned`;
        this._isMounted = true;
        this.initQueue();
        this.fetchAnime(firstPage);
        this.setState(prev => ({
            ...prev,
            isLoading: true,
        }));
        this.props.onIsLoading(true);
    }

    componentWillUnmount() {
        this._isMounted = false;
        this.initQueue();
    }

    initQueue() {
        if (this.queue) {
            this.queue.stop();
            delete this.queue;
        }
        this.queue = queue({
            concurrency: 4,
            autostart: true,
        });
        this.queue.on('end', () => {
            if (this._isMounted) {
                this.setState(prev => ({
                    ...prev,
                    isLoading: false,
                }));
                this.props.onIsLoading(false);
            }
        });
    }

    async fetchAnime(next) {
        this.queue.push(async () => {
            const { data: shows, links } = await fetchPage(next);
            shows.forEach(this.fetchShow);
            if (links.next) {
                await this.fetchAnime(links.next);
            }
        });
    }

    formatData(show) {
        const clone = { ...show };
        clone.averageRating = parseFloat(clone.averageRating, 10) || 0;
        clone.startDate = parse(clone.startDate);
        clone.endDate =
            clone.endDate == null ? NOT_YET_ENDED : parse(clone.endDate);
        return clone;
    }

    fetchShow(showmeta) {
        this.queue.push(async () => {
            if (this._isMounted) {
                const showinfo = await fetchPage(
                    showmeta.relationships.anime.links.related
                );
                if (showinfo.data) {
                    const show = {
                        ...showmeta.attributes,
                        ...this.formatData(showinfo.data.attributes),
                    };
                    if (this._isMounted) {
                        this.setState(prev => ({
                            ...prev,
                            anime: this.sort([...prev.anime, show]),
                        }));
                    }
                }
            }
        });
    }

    updateSorting(sortOpts) {
        this.setState(
            prev => ({
                ...prev,
                ...sortOpts,
            }),
            () => {
                this.setState(prev => ({
                    ...prev,
                    anime: this.sort(prev.anime),
                }));
            }
        );
    }

    sort(anime) {
        const { sortBy, sortDirection } = this.state;
        return anime.sort((a, b) => {
            if (sortDirection === 'ASC') {
                if (a[sortBy] > b[sortBy]) {
                    return 1;
                } else if (a[sortBy] < b[sortBy]) {
                    return -1;
                }
            } else {
                if (a[sortBy] > b[sortBy]) {
                    return -1;
                } else if (a[sortBy] < b[sortBy]) {
                    return 1;
                }
            }
            return 0;
        });
    }

    render() {
        const { username } = this.props;
        const { anime, isLoading, sortBy, sortDirection } = this.state;
        return (
            <div className="full">
                <h2>
                    Watchlist for {username}
                </h2>
                {anime.length === 0 && !isLoading
                    ? <p>Nothing in Want to watch list</p>
                    : <div
                          className={`full TableContainer ${isLoading
                              ? 'TableContainer--loading'
                              : null}`}
                      >
                          <AutoSizer>
                              {({ height, width }) =>
                                  <Table
                                      headerHeight={30}
                                      height={height}
                                      rowCount={anime.length}
                                      rowGetter={({ index }) => anime[index]}
                                      rowHeight={35}
                                      width={width}
                                      sort={this.updateSorting}
                                      sortBy={sortBy}
                                      sortDirection={sortDirection}
                                  >
                                      <Column
                                          dataKey="canonicalTitle"
                                          flexGrow={1}
                                          label="Title"
                                          width={100}
                                          cellRenderer={nameCell}
                                      />
                                      <Column
                                          dataKey="averageRating"
                                          label="Rating"
                                          width={100}
                                          cellRenderer={ratingCell}
                                      />
                                      <Column
                                          dataKey="episodeCount"
                                          label="Episodes"
                                          width={100}
                                      />
                                      <Column
                                          dataKey="showType"
                                          label="Type"
                                          width={100}
                                          cellRenderer={typeCell}
                                      />
                                      <Column
                                          dataKey="startDate"
                                          label="Start date"
                                          width={120}
                                          cellRenderer={dateCell}
                                      />
                                      <Column
                                          dataKey="endDate"
                                          label="End date"
                                          width={100}
                                          cellRenderer={dateCell}
                                      />
                                      <Column
                                          dataKey="synopsis"
                                          flexGrow={1}
                                          label="Synopsis"
                                          width={100}
                                          disableSort
                                      />
                                  </Table>}
                          </AutoSizer>
                      </div>}
                {isLoading ? <p className="Loading">Loading...</p> : null}
            </div>
        );
    }
}

function nameCell({ cellData, rowData }) {
    return (
        <a target="_blank" href={`https://kitsu.io/anime/${rowData.slug}`}>
            {cellData}
        </a>
    );
}

function dateCell({ cellData }) {
    return isEqual(cellData, NOT_YET_ENDED)
        ? '--'
        : format(cellData, 'DD-MM-YYYY');
}

function ratingCell({ cellData }) {
    return cellData === 0 ? '--' : cellData;
}

function typeCell({ cellData }) {
    return `${cellData[0].toUpperCase()}${cellData.slice(1, cellData.length)}`;
}
