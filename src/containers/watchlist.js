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
        this.queue = queue({
            concurrency: props.concurrency || 2,
            autostart: true,
        });
        this.state = {
            anime: [],
        };
        this.fetchAnime = this.fetchAnime.bind(this);
        this.getShow = this.getShow.bind(this);
    }

    componentWillMount() {
        const { userid } = this.props;
        const firstPage = `https://kitsu.io/api/edge/users/${userid}/library-entries?filter[status]=planned`;
        this.fetchAnime(firstPage);
    }

    async fetchAnime(next) {
        this.queue.push(async () => {
            const { data: shows, links } = await fetchPage(next);
            shows.forEach(this.getShow);
            if (links.next) {
                await this.fetchAnime(links.next);
            }
        });
    }

    getShow(showmeta) {
        this.queue.push(async () => {
            const showinfo = await fetchPage(
                showmeta.relationships.anime.links.related
            );
            const info = showinfo.data ? showinfo.data.attributes : {};
            const show = {
                ...showmeta.attributes,
                ...info,
            };
            this.setState(prev => ({
                anime: [...prev.anime, show],
            }));
        });
    }

    render() {
        const { username } = this.props;
        const { anime } = this.state;
        return (
            <div className="full">
                <h2>
                    Watchlist for {username}
                </h2>
                <div className="full">
                    <AutoSizer>
                        {({ height, width }) =>
                            <Table
                                height={height}
                                width={width}
                                headerHeight={20}
                                rowHeight={30}
                                rowCount={anime.length}
                                rowGetter={({ index }) => anime[index]}
                            >
                                <Column
                                    label="Title"
                                    dataKey="canonicalTitle"
                                    width={100}
                                    flexGrow={1}
                                    disableSort={false}
                                />
                            </Table>}
                    </AutoSizer>
                </div>
            </div>
        );
    }
}
