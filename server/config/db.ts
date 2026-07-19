import mongoose from 'mongoose';

const DEFAULT_MONGODB_URI = 'mongodb://Jagath9360:Jagath9360@ac-h6qynjc-shard-00-00.qzfl7jl.mongodb.net:27017,ac-h6qynjc-shard-00-01.qzfl7jl.mongodb.net:27017,ac-h6qynjc-shard-00-02.qzfl7jl.mongodb.net:27017/?ssl=true&replicaSet=atlas-13y4kk-shard-0&authSource=admin&appName=Jagath';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('MongoDB Atlas Connected successfully.');
  } catch (error) {
    console.error('MongoDB Connection Failed. Falling back to in-memory/mock persistence mode.', error);
  }
}
