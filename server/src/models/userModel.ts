import { model, Schema, CallbackError } from 'mongoose'
import Todo from './todoModel'
import { User } from '../types'

/* ======================
      userSchema
====================== */

const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    image: {
      type: String,
      required: false
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER'
    },
    tokens: {
      type: [String],
      required: true,
      default: []
    }
  },
  { timestamps: true }
)

///////////////////////////////////////////////////////////////////////////
//
// For document-level deleteOne()
//
//   const user = await User.findById(userId)
//   await user.deleteOne()
//
///////////////////////////////////////////////////////////////////////////

userSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function (next) {
    try {
      // console.log('\nDeleting associated todos because user.deleteOne() was triggered.')
      await Todo.deleteMany({ user: this._id })
      next()
    } catch (err) {
      next(err as CallbackError)
    }
  }
)

///////////////////////////////////////////////////////////////////////////
//
// For query-level deleteOne() and deleteMany()
//
//   Query-level deleteOne() :
//
//     await User.deleteOne({ _id: userId }) // Triggers: { document: false, query: true }
//     await User.deleteOne({ email: 'user@example.com' })
//
//   Query-level deleteMany() :
//
//     await User.deleteMany({ role: 'USER' }) // Triggers: { document: false, query: true }
//     await User.deleteMany({ createdAt: { $lt: someDate } })
//
///////////////////////////////////////////////////////////////////////////

userSchema.pre(
  ['deleteOne', 'deleteMany'],
  { document: false, query: true },
  async function (next) {
    try {
      const docs = await this.model.find(this.getQuery())
      const userIds = docs.map((doc) => doc._id)
      await Todo.deleteMany({ user: { $in: userIds } })
      next()
    } catch (err) {
      next(err as CallbackError)
    }
  }
)

///////////////////////////////////////////////////////////////////////////
//
// For findOneAndDelete()
//
//   await User.findOneAndDelete({ _id: userId })
//   await User.findOneAndDelete({ email: 'user@example.com' })
//
///////////////////////////////////////////////////////////////////////////

userSchema.pre('findOneAndDelete', async function (next) {
  try {
    const doc = await this.model.findOne(this.getQuery())
    if (doc) {
      await Todo.deleteMany({ user: doc._id })
    }
    next()
  } catch (err) {
    next(err as CallbackError)
  }
})

const User = model('User', userSchema)
export default User
