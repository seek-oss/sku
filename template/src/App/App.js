import React, { Component } from 'react';
import {
  StyleGuideProvider,
  Header,
  Footer,
  PageBlock,
  Card,
  Section,
  Text,
  TextField,
  Checkbox
} from 'seek-style-guide/react';
import styles from './App.less';

export default class App extends Component {
  constructor() {
    super();

    this.state = {
      name: '',
      showMessage: false
    };
  }

  handleChange = ({ target }) => {
    this.setState({
      [target.id]: target.type === 'checkbox' ? target.checked : target.value
    });
  };

  render() {
    return (
      <StyleGuideProvider>
        <Header />

        <PageBlock>
          <Card transparent>
            <Section header>
              <Text hero>create-seek-ui</Text>
            </Section>
          </Card>

          <Card>
            <Section>
              <div>
                <TextField
                  label="Name"
                  id="name"
                  value={this.state.name}
                  onChange={this.handleChange}
                />
              </div>
              <div className={styles.showMessage}>
                <Checkbox
                  label="Show greeting"
                  id="showMessage"
                  checked={this.state.showMessage}
                  onChange={this.handleChange}
                />
              </div>
            </Section>
          </Card>

          {!this.state.showMessage ? null : (
            <Card>
              <Section>
                <Text heading positive>
                  Hello {this.state.name || 'there'}!
                </Text>
              </Section>
            </Card>
          )}
        </PageBlock>

        <Footer />
      </StyleGuideProvider>
    );
  }
}
