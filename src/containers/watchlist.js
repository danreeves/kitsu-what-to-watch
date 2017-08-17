/* global fetch */
import React, { Component } from 'react'

export class WatchList extends Component {
  constructor (props) {
    super(props)
    this.state = {
      anime: []
    }
    this.fetchAnime = this.fetchAnime.bind(this)
  }

  componentWillMount () {
    const { userid } = this.props
    this.fetchAnime(userid)
  }

  async fetchAnime (userid) {
    const resp = await fetch(`https://kitsu.io/api/edge/users/${userid}/library-entries?filter[status]=planned`)
    const json = await resp.json()
    const shows = await Promise.all(json.data.map(async entry => {
      const showresp = await fetch(entry.relationships.anime.links.related)
      const showdata = await showresp.json()
      return {
        show: showdata.data ? showdata.data.attributes : null,
        attrs: entry.attributes
      }
    }))
    if (shows.length) {
      this.setState(prev => ({
        anime: shows
      }))
    }
  }

  render () {
    const { username } = this.props
    const { anime } = this.state
    return <div>
      <h2>Watchlist for {username}</h2>
      <ul>
        {anime.map(show => {
          if (show.show) {
            return <li>{show.show.canonicalTitle}</li>
          } else {
            return null
          }
        })}
      </ul>
    </div>
  }
}
