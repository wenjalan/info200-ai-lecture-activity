// training constants
const TRAIN_EPOCHS = 50;
const TRAIN_BATCH_SIZE = 10;

/**
 * Trains the model
 */
 async function start() {
    // get data
    const [trainXs, trainYs, testXs, testYs, classKeys] = await getData();
    renderData(trainXs, trainYs, classKeys);

    // get the model and render it
    const model = createModel(trainXs.shape[1]);
    tfvis.show.modelSummary({ name: 'Model Summary' }, model);

    // compile model
    model.compile({
        optimizer: tf.train.adam(),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });

    // train model
    await trainModel(model, trainXs, trainYs);

    // test model
    await testModel(model, testXs, testYs, classKeys);
}

/**
 * Retrives data from database to train model on
 * @return {[tf.Tensor, tf.Tensor, tf.Tensor, tf.Tensor]} [trainXs, trainYs, testXs, testYs]
 */
async function getData() {
    // todo: retrieve data from database
    return getFakeData();
}

/**
 * Returns faked data for testing, or in case of emergency
 * @return {[tf.Tensor, tf.Tensor, tf.Tensor, tf.Tensor, Object]} [trainXs, trainYs, testXs, testYs, classKeys]
 */
async function getFakeData() {
    // parameters to generate fake data 
    const numExamplesPerClass = 800;
    const [walkMin, walkMax] = [0, 15];
    const [bikeMin, bikeMax] = [10, 30];
    const [busMin, busMax] = [20, 60];
    const [carMin, carMax] = [40, 90];

    // create a key table for classes
    const classKeys = {
        walk: 0,
        bike: 1,
        bus: 2,
        car: 3
    };
    const classIdToClass = {
        0: 'walk',
        1: 'bike',
        2: 'bus',
        3: 'car'
    }

    // generate arrays of random commute times between min and max for each class
    const fakeData = [];
    for (let i = 0; i < numExamplesPerClass; i++) {
        fakeData.push({
            time: Math.floor(Math.random() * (walkMax - walkMin + 1)) + walkMin,
            class: 'walk'
        });
        fakeData.push({
            time: Math.floor(Math.random() * (bikeMax - bikeMin + 1)) + bikeMin,
            class: 'bike'
        });
        fakeData.push({
            time: Math.floor(Math.random() * (busMax - busMin + 1)) + busMin,
            class: 'bus'
        });
        fakeData.push({
            time: Math.floor(Math.random() * (carMax - carMin + 1)) + carMin,
            class: 'car'
        });
    }

    // shuffle the data
    shuffle(fakeData);

    // split data into train and test
    const trainData = fakeData.slice(0, fakeData.length * 0.8);
    const testData = fakeData.slice(fakeData.length * 0.8);

    // create tensors for train data
    const trainXs = tf.tensor2d(trainData.map(d => [d.time]));

    // create one-hot tensor depending on class
    const trainYs = tf.stack(trainData.map(d => {
        const classIndex = classKeys[d.class];
        const oneHot = tf.oneHot(classIndex, Object.keys(classKeys).length);
        return oneHot;
    }));

    // create tensors for test data
    const testXs = tf.tensor2d(testData.map(d => [d.time]));

    // create one-hot tensor depending on class
    const testYs = tf.stack(testData.map(d => {
        const classIndex = classKeys[d.class];
        const oneHot = tf.oneHot(classIndex, Object.keys(classKeys).length);
        return oneHot;
    }));

    // return tensors and class key array
    return [trainXs, trainYs, testXs, testYs, classIdToClass];
}

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

/**
 * Returns a sequential model
 * @param {number} inputShape
 */
function createModel(inputShape) {
    // define new sequential model
    const model = tf.sequential();

    // add dense input
    model.add(tf.layers.dense({
        inputShape: inputShape,
        kernalInitializer: 'varianceScaling',
        units: 1,
        useBias: true,
    }));

    // add a dense hidden
    model.add(tf.layers.dense({
        kernalInitializer: 'varianceScaling',
        units: 2,
        useBias: true
    }));

    // add dense output
    model.add(tf.layers.dense({
        units: 4,
        kernalInitializer: 'VarianceScaling',
        activation: 'softmax',
        useBias: true,
    }));

    // return the model
    return model;
}

/**
 * Renders data to the page
 * @param {tf.Tensor} trainXs
 * @param {tf.Tensor} trainYs
 * @param {tf.Tensor} testXs
 * @param {tf.Tensor} testYs
 * @param {Object} classKeys
 */
function renderData(trainXs, trainYs, classKeys) {
    // convert tensors to plottable points
    const trainXsData = trainXs.dataSync();
    const trainYsData = trainYs.arraySync().map(d => d.indexOf(1));
    // console.log(trainYsData);
    
    const points = [];
    for (let i = 0; i < trainXsData.length; i++) {
        points.push({
            x: trainXsData[i],
            y: trainYsData[i],
            class: classKeys[trainYsData[i]]
        });
    }

    // render data
    tfvis.render.scatterplot(
        { name: 'Train Data' },
        { values: points },
        {
            xLabel: 'Time (minutes)',
            yLabel: 'Class',
            yAxisDomain: [-0.5, 3.5],
            height: 300
        }
    );
}

/**
 * Trains model and renders progress to page
 * @param {tf.Model} model
 * @param {tf.Tensor} trainXs
 * @param {tf.Tensor} trainYs
 */
async function trainModel(model, trainXs, trainYs) {
    return await model.fit(trainXs, trainYs, {
        batchSize: TRAIN_BATCH_SIZE,
        epochs: TRAIN_EPOCHS,
        shuffle: true,
        callbacks: tfvis.show.fitCallbacks(
            { name: 'Training Performance' },
            ['loss', 'acc'],
            { height: 200, callbacks: ['onEpochEnd'] }
        )
    });
}
 
/**
 * Uses the model to predict the mode of transport of a uniform range of times
 * @param {tf.Model} model
 * @param {tf.Tensor} inputData
 */
async function testModel(model, trainXs, trainYs, classKeys) {
    // generate predictions for a uniform range of times from 0 to 60
    const [xs, preds] = tf.tidy(() => {
        const xs = tf.linspace(0, 90, 100);
        const preds = model.predict(xs.reshape([100, 1])).argMax(-1);
        return [xs.dataSync(), preds.dataSync()];
    });

    // convert predictions to points
    const predictedPoints = Array.from(xs).map((x, i) => ({
        x, 
        y: preds[i],
        class: classKeys[preds[i]]
    }));
    console.log(predictedPoints);

    // convert original trainXs and trainYs into points
    const trainXsData = trainXs.arraySync().map(d => d[0]);
    const trainYsData = trainYs.arraySync().map(d => d.indexOf(1));
    const originalPoints = trainXsData.map((x, i) => ({
        x,
        y: trainYsData[i],
        class: classKeys[trainYsData[i]]
    }));
    console.log(originalPoints);

    // render predictions
    tfvis.render.scatterplot(
        { name: 'Predictions vs Actual' },
        { values: [originalPoints, predictedPoints], series: ['actual', 'predicted'] },
        {
            xLabel: 'Time (minutes)',
            yLabel: 'Class',
            yAxisDomain: [-0.5, 3.5],
            height: 300
        }
    );
}

document.addEventListener('DOMContentLoaded', start);