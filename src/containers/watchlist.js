/* global fetch */
import React, { Component } from 'react';
import { AutoSizer, Column, Table } from 'react-virtualized';
import queue from 'queue';

async function fetchPage(url) {
    const resp = await fetch(url);
    const json = await resp.json();
    return json;
}

export class WatchList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            anime: [],
            isLoading: false,
        };
        this.fetchAnime = this.fetchAnime.bind(this);
        this.fetchShow = this.fetchShow.bind(this);
        this.initQueue = this.initQueue.bind(this);
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
            concurrency: 2,
            autostart: true,
        });
        this.queue.on('end', () => {
            if (this._isMounted) {
                this.setState(prev => ({
                    ...prev,
                    isLoading: false,
                }));
            }
        });
        this.queue.on('success', () => {
            console.log(this.props.username, 'queue job done');
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

    fetchShow(showmeta) {
        this.queue.push(async () => {
            if (this._isMounted) {
                const showinfo = await fetchPage(
                    showmeta.relationships.anime.links.related
                );
                const info = showinfo.data ? showinfo.data.attributes : {};
                const show = {
                    ...showmeta.attributes,
                    ...info,
                };
                if (this._isMounted) {
                    this.setState(prev => ({
                        ...prev,
                        anime: [...prev.anime, show],
                    }));
                }
            }
        });
    }

    render() {
        const { username } = this.props;
        const { anime, isLoading } = this.state;
        return (
            <div className="full">
                <h2>
                    Watchlist for {username}
                </h2>
                {isLoading ? <p>Loading...</p> : null}
                {anime.length === 0
                    ? <p>Nothing in Want to watch list</p>
                    : <div className="full">
                          <AutoSizer>
                              {({ height, width }) =>
                                  <Table
                                      height={height}
                                      width={width}
                                      headerHeight={20}
                                      rowHeight={30}
                                      rowCount={anime.length}
                                      rowGetter={({ index }) => anime[index]}
                                      sortBy="canonicalTitle"
                                  >
                                      <Column
                                          label="Title"
                                          dataKey="canonicalTitle"
                                          width={100}
                                          flexGrow={1}
                                      />
                                  </Table>}
                          </AutoSizer>
                      </div>}
            </div>
        );
    }
}
