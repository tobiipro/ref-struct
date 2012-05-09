
var assert = require('assert')
  , ref = require('ref')
  , Struct = require('../')
  , bindings = require('./build/Release/struct_tests')

describe('Struct', function () {

  afterEach(gc)

  it('should be a function', function () {
    assert.equal('function', typeof Struct)
  })

  it('should return a struct constuctor function', function () {
    var S = Struct()
    assert.equal('function', typeof S)
  })

  it('should throw when the same field name is speicified more than once', function () {
    var S = Struct({ a: ref.types.int })
    assert.throws(function () {
      S.defineProperty('a', ref.types.int)
    })
  })

  it('should work in a simple case', function () {
    var SimpleStruct = Struct({
        'first': ref.types.byte
      , 'last':  ref.types.byte
    })
    assert.equal(2, SimpleStruct.size)
    assert.equal(1, SimpleStruct.alignment)

    var ss = new SimpleStruct({ first: 50, last: 100 })
    assert.equal(50, ss.first)
    assert.equal(100, ss.last)
  })

  it('should work in a more complex case', function () {
    var MegaStruct = new Struct([
        ['byte', 'byteVal']
      , ['int8', 'int8Val']
      , ['int16', 'int16Val']
      , ['uint16', 'uint16Val']
      , ['int32', 'int32Val']
      , ['uint32', 'uint32Val']
      , ['float', 'floatVal']
      , ['double', 'doubleVal']
      , ['pointer', 'pointerVal']
    ])
    var msTestPtr = new Buffer(1)
    var ms = new MegaStruct({
        byteVal: 100
      , int8Val: -100
      , int16Val: -1000
      , uint16Val: 1000
      , int32Val: -10000
      , uint32Val: 10000
      , floatVal: 1.25
      , doubleVal: 1000.0005
      , pointerVal: msTestPtr
    })
    assert.equal(100, ms.byteVal)
    assert.equal(-100, ms.int8Val)
    assert.equal(-1000, ms.int16Val)
    assert.equal(1000, ms.uint16Val)
    assert.equal(-10000, ms.int32Val)
    assert.equal(10000, ms.uint32Val)
    assert.equal(1.25, ms.floatVal)
    assert.equal(1000.0005, ms.doubleVal)
    assert.equal(ms.pointerVal.address(), msTestPtr.address())
  })

  it('should allow Struct nesting', function () {

    var ChildStruct = new Struct([
        ['int', 'a']
      , ['int', 'b']
    ])
    var ParentStruct = new Struct([
        [ChildStruct, 'childA']
      , [ChildStruct, 'childB']
    ])

    var ps = new ParentStruct({
        childA: { a: 100, b: 200 }
      , childB: { a: 300, b: 400 }
    })

    assert.equal(100, ps.childA.a)
    assert.equal(200, ps.childA.b)
    assert.equal(300, ps.childB.a)
    assert.equal(400, ps.childB.b)
  })

  describe('offsets and sizeofs', function () {

    function test (structType, testNumber) {
      describe('Struct test' + testNumber, function () {
        it('should have a matching sizeof()', function () {
          var expectedSize = bindings['test' + testNumber + ' sizeof']
          assert.equal(expectedSize, structType.size, 'test' + testNumber +
            ': sizeof(): expected ' + structType.size + ' to equal ' + expectedSize)
        })
        Object.keys(structType.fields).forEach(function (name) {
          it('should have a matching offsetof() for "' + name + '"', function () {
            var expectedOffset = bindings['test' + testNumber + ' offsetof ' + name]
            var offset = structType.fields[name].offset
            assert.equal(expectedOffset, offset, 'test' + testNumber + ': offsetof('
                + name + '): expected ' + offset + ' to equal ' + expectedOffset)
          })
        })
      })
    }

    var test1 = Struct({
        'a': ref.types.int
      , 'b': ref.types.int
      , 'c': ref.types.double
    })
    test(test1, 1)

    var test2 = Struct({
        'a': ref.types.int
      , 'b': ref.types.double
      , 'c': ref.types.int
    })
    test(test2, 2)

    var test3 = Struct({
        'a': ref.types.double
      , 'b': ref.types.int
      , 'c': ref.types.int
    })
    test(test3, 3)

    var test4 = Struct({
        'a': ref.types.double
      , 'b': ref.types.double
      , 'c': ref.types.int
    })
    test(test4, 4)

    var test5 = Struct({
        'a': ref.types.int
      , 'b': ref.types.double
      , 'c': ref.types.double
    })
    test(test5, 5)

    var test6 = Struct({
        'a': ref.types.char
      , 'b': ref.types.short
      , 'c': ref.types.int
    })
    test(test6, 6)

    var test7 = Struct({
        'a': ref.types.int
      , 'b': ref.types.short
      , 'c': ref.types.char
    })
    test(test7, 7)

    var test8 = Struct({
        'a': ref.types.int
      , 'b': ref.types.short
      , 'c': ref.types.char
      , 'd': ref.types.char
    })
    test(test8, 8)

    var test9 = Struct({
        'a': ref.types.int
      , 'b': ref.types.short
      , 'c': ref.types.char
      , 'd': ref.types.char
      , 'e': ref.types.char
    })
    test(test9, 9)

    var test10 = Struct({
        'a': test1
      , 'b': ref.types.char
    })
    test(test10, 10)

    var test11 = Struct()
    test11.defineProperty('a', ref.types.size_t)
    test11.defineProperty('b', ref.types.ushort)
    test11.defineProperty('c', ref.types.ushort)
    // this struct contains an Array of `test11 *` structs, so `test11 **`...
    var test11_ptr_ptr = ref.refType(ref.refType(test11))
    test11.defineProperty('d', test11_ptr_ptr)
    test(test11, 11)

    var test12 = Struct({
        'a': ref.refType(ref.types.char)
      , 'b': ref.types.int
    })
    test(test12, 12)

  })

})
