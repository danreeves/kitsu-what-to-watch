/* global fetch */
import React, { Component } from 'react';
import './App.css';
import 'react-virtualized/styles.css';
import { WatchList } from './containers/watchlist';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: null,
      userid: null,
    };
    this.fetchUser = this.fetchUser.bind(this);
  }

  async fetchUser(e) {
    const name = e.target.value;
    const resp = await fetch(
      `https://kitsu.io/api/edge/users?filter[name]=${name}`
    );
    const data = await resp.json();
    if (data.data.length > 0) {
      this.setState((prev, props) => ({
        ...prev,
        username: name,
        userid: data.data[0].id,
      }));
    } else {
      this.setState((prev, props) => ({
        ...prev,
        username: name,
        userid: null,
      }));
    }
  }

  componentDidMount() {
    this.fetchUser({ target: { value: 'danreeves' } });
  }

  render() {
    const { username, userid } = this.state;
    return (
      <div className="App">
        <input type="text" onChange={this.fetchUser} />
        {username && userid
          ? <WatchList userid={userid} username={username} />
          : <p>User not found</p>}
      </div>
    );
  }
}

export default App;
