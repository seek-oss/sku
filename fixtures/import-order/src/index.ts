import './reset'; // side-effect imports should stay put

import path from 'path'; //  built-in

import someModule from 'some-module'; // external

import utils from 'src/utils'; // internal

import distantParent from '../../../parent'; // parents
import Parent from '../parent'; // parents

import LocalComponent from './LocalComponent'; // sibling

import myself from '.'; // index

import styles from './styles.less'; // styles
import vanillaStyles from './vanillaStyles.css'; // styles
