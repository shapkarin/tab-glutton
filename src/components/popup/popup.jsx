import React from 'react';
import { ThemeProvider } from 'styled-components';
import Tree from 'react-virtualized-tree'

import TabItem from '../tab-item/tab-item.jsx';
import {
  BodylStyle,
  Navigation,
  Filter,
  Main,
  Section,
  Header,
  Title,
  TabList
} from './style.js';
import themes, { DEFAULT_THEME } from '../../themes';
const groups = {
  A: [0, 1, 2, 3],
  B: [4, 5, 6, 7],
  C: [8, 9, 10, 11],
  D: [12, 13, 14, 15],
  E: [16, 17, 18, 19],
  F: [20, 21, 22, 23],
  G: [24, 25, 26, 27],
  H: [28, 29, 30, 31],
};

const countries = {
  0: {name: 'Russia', flag: 'RU'},
  1: {name: 'Saudi Arabia', flag: 'SA'},
  2: {name: 'Egypt', flag: 'EG'},
  3: {name: 'Uruguay', flag: 'UY'},
  4: {name: 'Portugal', flag: 'PT'},
  5: {name: 'Spain', flag: 'ES'},
  6: {name: 'Morocco', flag: 'MA'},
  7: {name: 'Iran', flag: 'IR'},
  8: {name: 'France', flag: 'FR'},
  9: {name: 'Australia', flag: 'AU'},
  10: {name: 'Peru', flag: 'PE'},
  11: {name: 'Denmark', flag: 'DK'},
  12: {name: 'Argentina', flag: 'AR'},
  13: {name: 'Iceland', flag: 'IS'},
  14: {name: 'Croatia', flag: 'HR'},
  15: {name: 'Nigeria', flag: 'NG'},
  16: {name: 'Brazil', flag: 'BR'},
  17: {name: 'Switzerland', flag: 'CH'},
  18: {name: 'Costa Rica', flag: 'CR'},
  19: {name: 'Serbia', flag: 'RS'},
  20: {name: 'Germany', flag: 'DE'},
  21: {name: 'Mexico', flag: 'MX'},
  22: {name: 'Sweden', flag: 'SE'},
  23: {name: 'South Korea', flag: 'KR'},
  24: {name: 'Belgium', flag: 'BE'},
  25: {name: 'Panama', flag: 'PA'},
  26: {name: 'Tunisia', flag: 'TN'},
  27: {name: 'England', flag: 'GB'},
  28: {name: 'Poland', flag: 'PL'},
  29: {name: 'Senegal', flag: 'SN'},
  30: {name: 'Colombia', flag: 'CO'},
  31: {name: 'Japan', flag: 'JP'},
};

const worldCup = Object.keys(groups).reduce((wc, g) => {
  const groupCountries = groups[g];

  const group = {
    id: Math.random(),
    name: `Group ${g}`,
    state: {
      expanded: true,
    },
    children: groupCountries.map(gc => ({
      id: gc,
      name: countries[gc].name,
    })),
  };

  return [...wc, group];
}, []);

export default class Popup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      windows: [],
      filter: '',
      mru: {},
      tree: worldCup
    };
  }
  componentDidMount() {

    //todo: refafct
    chrome.runtime.sendMessage({action: 'mru'}, (mru) => {
      // Update the state with the most-recently used windows
      this.setState({mru});

      chrome.windows.getAll({populate: true}, (windows) => {

        const w = windows.sort((left, right) => {
          // Compare the timestamps, if they exist, from the mru state
          const comp = (mru[right.id] || 0) - (mru[left.id] || 0);
          if (comp === 0) {
            // If there's no data, go off the focused field of the left item
            return left.focused ? -1 : (right.id - left.id);
          }
          return comp;
        }).map(w => ({...w, children: w.tabs}));
        
        this.setState({windows: w});
      });
    });
    this.setState({isSeparated: JSON.parse(localStorage.getItem('isSeparated'))});
    this.refs.filter.focus();
  }
  filter(event) {
    this.setState({filter: event.target.value.trim().toLocaleLowerCase()});
  }
  closeTab(tab, event) {
    // Don't close the window when closing tabs
    event.stopPropagation();

    // Close the tab and refresh the list of windows
    chrome.tabs.remove(tab.id, () => {
      const windows = this.state.windows.reduce((windows, $window) => {
        $window.tabs = $window.tabs.filter($tab => $tab.id !== tab.id);
        if ($window.tabs.length > 0) {
          // Add the window back only if it has some tabs
          windows.push($window);
        }
        return windows;
      }, []);
      this.setState({windows});
    });
  }
  render() {
    const {filter, windows, mru } = this.state;
    const theme = themes[window.localStorage.getItem('theme')] || themes[DEFAULT_THEME];
    return (
      <ThemeProvider theme={theme}>
        <BodylStyle />
        <Navigation>
          <Filter
            ref="filter"
            type="text"
            placeholder="Search"
            onChange={this.filter.bind(this)}
          />
        </Navigation>
        <Main>
          <Tree nodes={this.state.tree} >
            {({style, node, children, ...rest}) => {
              if(!node.children){
                return <TabItem key={node.id} tab={node} onClose={this.closeTab.bind(this)} {...rest} />
              } else {
                return <Header>
                  <Title>Tabs {node.id}</Title>
                </Header>
              }
            }}
          </Tree>
        </Main>
      </ThemeProvider>
    );
  }
}
