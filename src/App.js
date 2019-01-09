/* global fetch */
import React, { Component } from 'react';
import debounce from 'debounce';
import 'normalize.css';
import './App.css';
import 'react-virtualized/styles.css';
import { WatchList } from './containers/watchlist';
import { Kitsu } from './components/kitsu';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      userid: null,
      notFound: false,
      isLoading: false,
    };
    this.fetchUser = debounce(this.fetchUser.bind(this), 250);
    this.handleInput = this.handleInput.bind(this);
    this.listIsLoading = this.listIsLoading.bind(this);
  }

  handleInput(e) {
    const name = e.target.value;
    this.fetchUser(name);
  }

  async fetchUser(name) {
    this.setState(prev => ({
      ...prev,
      username: name,
      userid: null,
    }));
    const resp = await fetch(
      `https://kitsu.io/api/edge/users?filter[slug]=${name}`
    );
    if (resp.ok) {
      const { data } = await resp.json();
      if (data.length > 0) {
        const { username } = this.state;
        if (resp.url.endsWith(username)) {
          this.setState((prev, props) => ({
            ...prev,
            username: name,
            userid: data[0].id,
            notFound: false,
          }));
        }
      } else {
        this.setState((prev, props) => ({
          ...prev,
          notFound: true,
        }));
      }
    }
  }

  listIsLoading(isLoading) {
    this.setState(prev => ({
      ...prev,
      isLoading,
    }));
  }

  render() {
    const { username, userid, isLoading, notFound } = this.state;
    return (
      <div className="App">
        <div className="Header">
          <Kitsu className={isLoading ? 'Spin' : null} />
          <label>
            Kitsu username:{' '}
            <input
              type="text"
              name="kitsu-username"
              onChange={this.handleInput}
            />
          </label>
        </div>
        {username.length && userid
          ? <WatchList
              userid={userid}
              username={username}
              onIsLoading={this.listIsLoading}
            />
          : username.length && notFound
            ? <p className="Msg">User not found</p>
            : <p className="Msg">Type in a username</p>}
        <p>
          A world wide website by <a href="https://danreev.es">danreeves</a>
        </p>
      </div>
    );
  }
}

export default App;
