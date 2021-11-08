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
    const numExamplesPerClass = 100;
    const [walkMin, walkMax] = [0, 10];
    const [bikeMin, bikeMax] = [10, 30];
    const [busMin, busMax] = [10, 30];
    const [carMin, carMax] = [30, 60];

    // create a key table for classes
    const classKeys = {
        walk: 0,
        bike: 1,
        bus: 2,
        car: 3
    };

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

    // create tensors for train and test data
    const trainXs = tf.tensor2d(trainData.map(d => [d.time]));
    const trainYs = tf.tensor2d(trainData.map(d => [classKeys[d.class]]));
    const testXs = tf.tensor2d(testData.map(d => [d.time]));
    const testYs = tf.tensor2d(testData.map(d => [classKeys[d.class]]));

    // return tensors and class key array
    return [trainXs, trainYs, testXs, testYs, classKeys];
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
 * Trains the model
 */
async function start() {
    // get data
    const [trainXs, trainYs, testXs, testYs, classKeys] = await getData();

    // print out the data
    console.log('trainXs:', trainXs.shape);
    console.log('trainYs:', trainYs.shape);
    console.log('testXs:', testXs.shape);
    console.log('testYs:', testYs.shape);
    console.log('classKeys:', classKeys);

    // render data
    renderData(trainXs, trainYs, testXs, testYs, classKeys);
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
    const trainYsData = trainYs.dataSync();
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
            height: 300
        }
    );
}

document.addEventListener('DOMContentLoaded', start);