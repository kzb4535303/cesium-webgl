import * as cesiumBasicController from './cesiumBasicController';
import * as cesiumLayerController from './cesiumLayerController';
import * as s3mFunctionalController from './s3mFunctionalController';
import eventEmitter from "./eventEmitter";

export default {
    eventEmitter,
    ...s3mFunctionalController,
    ...cesiumLayerController,
    ...cesiumBasicController
}