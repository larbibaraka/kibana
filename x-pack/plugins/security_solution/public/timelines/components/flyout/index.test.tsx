/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { mount, shallow } from 'enzyme';
import { set } from '@elastic/safer-lodash-set/fp';
import React from 'react';
import '../../../common/mock/react_beautiful_dnd';

import {
  apolloClientObservable,
  mockGlobalState,
  TestProviders,
  SUB_PLUGINS_REDUCER,
  kibanaObservable,
  createSecuritySolutionStorageMock,
} from '../../../common/mock';
import { createStore, State } from '../../../common/store';
import { mockDataProviders } from '../timeline/data_providers/mock/mock_data_providers';
import * as timelineActions from '../../store/timeline/actions';

import { Flyout } from '.';
import { FlyoutButton } from './button';

const mockDispatch = jest.fn();
jest.mock('react-redux', () => {
  const original = jest.requireActual('react-redux');

  return {
    ...original,
    useDispatch: () => mockDispatch,
  };
});

jest.mock('../timeline', () => ({
  // eslint-disable-next-line react/display-name
  StatefulTimeline: () => <div />,
}));

const usersViewing = ['elastic'];

describe('Flyout', () => {
  const state: State = mockGlobalState;
  const { storage } = createSecuritySolutionStorageMock();

  beforeEach(() => {
    mockDispatch.mockClear();
  });

  describe('rendering', () => {
    test('it renders correctly against snapshot', () => {
      const wrapper = shallow(
        <TestProviders>
          <Flyout timelineId="test" usersViewing={usersViewing} />
        </TestProviders>
      );
      expect(wrapper.find('Flyout')).toMatchSnapshot();
    });

    test('it renders the default flyout state as a button', () => {
      const wrapper = mount(
        <TestProviders>
          <Flyout timelineId="test" usersViewing={usersViewing} />
        </TestProviders>
      );

      expect(
        wrapper.find('[data-test-subj="flyout-button-not-ready-to-drop"]').first().text()
      ).toContain('Timeline');
    });

    test('it does NOT render the fly out button when its state is set to flyout is true', () => {
      const stateShowIsTrue = set('timeline.timelineById.test.show', true, state);
      const storeShowIsTrue = createStore(
        stateShowIsTrue,
        SUB_PLUGINS_REDUCER,
        apolloClientObservable,
        kibanaObservable,
        storage
      );

      const wrapper = mount(
        <TestProviders store={storeShowIsTrue}>
          <Flyout timelineId="test" usersViewing={usersViewing} />
        </TestProviders>
      );

      expect(wrapper.find('[data-test-subj="flyout-button-not-ready-to-drop"]').exists()).toEqual(
        false
      );
    });

    test('it does render the data providers badge when the number is greater than 0', () => {
      const stateWithDataProviders = set(
        'timeline.timelineById.test.dataProviders',
        mockDataProviders,
        state
      );
      const storeWithDataProviders = createStore(
        stateWithDataProviders,
        SUB_PLUGINS_REDUCER,
        apolloClientObservable,
        kibanaObservable,
        storage
      );

      const wrapper = mount(
        <TestProviders store={storeWithDataProviders}>
          <Flyout timelineId="test" usersViewing={usersViewing} />
        </TestProviders>
      );

      expect(wrapper.find('[data-test-subj="badge"]').exists()).toEqual(true);
    });

    test('it renders the correct number of data providers badge when the number is greater than 0', () => {
      const stateWithDataProviders = set(
        'timeline.timelineById.test.dataProviders',
        mockDataProviders,
        state
      );
      const storeWithDataProviders = createStore(
        stateWithDataProviders,
        SUB_PLUGINS_REDUCER,
        apolloClientObservable,
        kibanaObservable,
        storage
      );

      const wrapper = mount(
        <TestProviders store={storeWithDataProviders}>
          <Flyout timelineId="test" usersViewing={usersViewing} />
        </TestProviders>
      );

      expect(wrapper.find('[data-test-subj="badge"]').first().text()).toContain('10');
    });

    test('it hides the data providers badge when the timeline does NOT have data providers', () => {
      const wrapper = mount(
        <TestProviders>
          <Flyout timelineId="test" usersViewing={usersViewing} />
        </TestProviders>
      );

      expect(wrapper.find('[data-test-subj="badge"]').first().props().style!.visibility).toEqual(
        'hidden'
      );
    });

    test('it does NOT hide the data providers badge when the timeline has data providers', () => {
      const stateWithDataProviders = set(
        'timeline.timelineById.test.dataProviders',
        mockDataProviders,
        state
      );
      const storeWithDataProviders = createStore(
        stateWithDataProviders,
        SUB_PLUGINS_REDUCER,
        apolloClientObservable,
        kibanaObservable,
        storage
      );

      const wrapper = mount(
        <TestProviders store={storeWithDataProviders}>
          <Flyout timelineId="test" usersViewing={usersViewing} />
        </TestProviders>
      );

      expect(wrapper.find('[data-test-subj="badge"]').first().props().style!.visibility).toEqual(
        'inherit'
      );
    });

    test('should call the onOpen when the mouse is clicked for rendering', () => {
      const wrapper = mount(
        <TestProviders>
          <Flyout timelineId="test" usersViewing={usersViewing} />
        </TestProviders>
      );

      wrapper.find('[data-test-subj="flyoutOverlay"]').first().simulate('click');

      expect(mockDispatch).toBeCalledWith(timelineActions.showTimeline({ id: 'test', show: true }));
    });
  });

  describe('showFlyoutButton', () => {
    test('should show the flyout button when show is true', () => {
      const openMock = jest.fn();
      const wrapper = mount(
        <TestProviders>
          <FlyoutButton
            dataProviders={mockDataProviders}
            show={true}
            timelineId="test"
            onOpen={openMock}
          />
        </TestProviders>
      );
      expect(wrapper.find('[data-test-subj="flyout-button-not-ready-to-drop"]').exists()).toEqual(
        true
      );
    });

    test('should NOT show the flyout button when show is false', () => {
      const openMock = jest.fn();
      const wrapper = mount(
        <TestProviders>
          <FlyoutButton
            dataProviders={mockDataProviders}
            show={false}
            timelineId="test"
            onOpen={openMock}
          />
        </TestProviders>
      );
      expect(wrapper.find('[data-test-subj="flyout-button-not-ready-to-drop"]').exists()).toEqual(
        false
      );
    });

    test('should return the flyout button with text', () => {
      const openMock = jest.fn();
      const wrapper = mount(
        <TestProviders>
          <FlyoutButton
            dataProviders={mockDataProviders}
            show={true}
            timelineId="test"
            onOpen={openMock}
          />
        </TestProviders>
      );
      expect(
        wrapper.find('[data-test-subj="flyout-button-not-ready-to-drop"]').first().text()
      ).toContain('Timeline');
    });

    test('should call the onOpen when it is clicked', () => {
      const openMock = jest.fn();
      const wrapper = mount(
        <TestProviders>
          <FlyoutButton
            dataProviders={mockDataProviders}
            show={true}
            timelineId="test"
            onOpen={openMock}
          />
        </TestProviders>
      );
      wrapper.find('[data-test-subj="flyoutOverlay"]').first().simulate('click');

      expect(openMock).toBeCalled();
    });
  });
});
