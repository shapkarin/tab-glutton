import React from 'react';
import { ThemeProvider } from 'styled-components';

import TabItem from '../tab-item/tab-item.jsx';
import {
  BodylStyle,
  Navigation,
  Filter,
  Main,
  Section,
  Header,
  Title,
  TabList,
  ChangeList
} from './style.js';
import themes, { DEFAULT_THEME } from '../../themes';

export default class Popup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      windows: [],
      filter: '',
      mru: {},
      editor: false,
      selected: []
    };
    this.toggleEditor = this.toggleEditor.bind(this);
  }
  componentDidMount() {
    chrome.runtime.sendMessage({action: 'mru'}, (mru) => {
      // Update the state with the most-recently used windows
      this.setState({mru});
    });
    chrome.windows.getAll({populate: true}, (windows) => {
      this.setState({windows});
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
  selectTab(tab, event){
    event.stopPropagation();
    this.setState({ select: [...this.state.select, tab.id] })
  }
  closeTabs(){

  }
  toggleEditor(){
    this.setState({ editor: !this.state.editor });
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
          {!this.state.editor ? <ChangeList
            viewBox="0 0 24 24"
            onClick={this.toggleEditor}
          >
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            <path d="M0 0h24v24H0z" fill="none"/>
          </ChangeList>
          :
          <div>
            <span>Remove</span>
            <span onClick={this.toggleEditor}>Done</span>
          </div>
          }
        </Navigation>
        <Main>
          {
            windows.sort((left, right) => {
              // Compare the timestamps, if they exist, from the mru state
              const comp = (mru[right.id] || 0) - (mru[left.id] || 0);
              if (comp === 0) {
                // If there's no data, go off the focused field of the left item
                return left.focused ? -1 : (right.id - left.id);
              }
              return comp;
            }).map($window =>
              <Section
                className={this.state.isSeparated ? '' : 'window'}
                key={$window.id}
              >
                <Header>
                  <Title>{$window.tabs.length} tabs</Title>
                </Header>
                <TabList>
                  {
                    $window.tabs
                      .filter(tab => filter.length === 0 || tab.title.toLocaleLowerCase().indexOf(filter) >= 0 || tab.url.toLocaleLowerCase().indexOf(filter) >= 0)
                      .map(tab => (
                        <TabItem
                          key={tab.id}
                          tab={tab}
                          onClose={this.closeTab.bind(this)}
                          onSelectTab={this.selectTab.bind(this)}
                          editor={this.state.editor}
                        />
                      ))
                  }
                </TabList>
              </Section>
            )
          }
        </Main>
      </ThemeProvider>
    );
  }
}
