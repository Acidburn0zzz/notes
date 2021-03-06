import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import INITIAL_CONTENT from '../data/initialContent';

import NewIcon from './icons/NewIcon';
import { deleteNote, setFocusedNote, createNote } from '../actions';
import { formatLastModified } from '../utils/utils';


class ListPanel extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;

    this.requestNewNote = () => {
      // Request not id from background.
      this.props.dispatch(createNote()).then(id => {
        props.history.push(`/note/${id}`);
      });
    };
  }

  componentWillMount() {

    // If user is not logged, and has no notes, we create initial content for him
    // and redirect to it.
    if (this.props.state.sync.welcomePage) {
      this.props.dispatch(createNote(INITIAL_CONTENT)).then(id => {
        this.props.history.push(`/note/${id}`);
      });
    } else {
      // We delete notes with no content
      const listOfEmptyNote = this.props.state.notes.filter((n) => !n.firstLine ).map((n) => n.id);
      listOfEmptyNote.forEach((id) => this.props.dispatch(deleteNote(id)));

      // Set no focused Note to create new note on send note event.
      this.props.dispatch(setFocusedNote());
    }
  }

  componentDidMount() {
    // Disable right clicks
    // Refs: https://stackoverflow.com/a/737043/186202
    document.querySelectorAll('.listView').forEach(sel => {
      sel.addEventListener('contextmenu', e => {
        e.preventDefault();
      });
    });

    // Send message to background.js stating editor has been initialized
    // and is ready to receive content
    chrome.runtime.sendMessage({action: 'editor-ready'});
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  render() {
    return (
      <div className="listView">
        <button
          className="btn fullWidth borderBottom"
          onClick={this.requestNewNote}>
          <NewIcon /> <span>{ browser.i18n.getMessage('newNote') }</span>
        </button>
        <ul>
          { this.props.state.notes.filter((note) => note.firstLine ).sort((a, b) => {
            if (a.lastModified.getTime() !== b.lastModified.getTime()) {
              return a.lastModified.getTime() < b.lastModified.getTime() ? 1 : -1;
            }
            return a.firstLine < b.firstLine ? 1 : -1;
          }).map((note) => {
            return (
              <li key={note.id}>
                <button
                  onClick={ () => this.props.history.push(`/note/${note.id}`) }
                  className="btn fullWidth borderBottom">
                  <p><strong>{ note.firstLine }</strong></p>
                  <p><span>{ formatLastModified(note.lastModified) }</span> { note.secondLine }</p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    state
  };
}


ListPanel.propTypes = {
    state: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired
};

export default connect(mapStateToProps)(ListPanel);
