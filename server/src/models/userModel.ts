import { model, Schema } from 'mongoose'
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
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER'
    },
    token: {
      type: String,
      required: false
    }
  },
  { timestamps: true }
)

const User = model('User', userSchema)
export default User
