const calculator = {
    add: (a, b) => a + b,
    sub: (a, b) => a - b,
    mult: (a, b) => a * b,
    div: (a, b) => a / b,
};
calculator['self'] = calculator;

const mirror = {
    a: 1,
    b: this.a,
};

module.exports = {
    calculator: calculator,
    mirror: mirror,
};