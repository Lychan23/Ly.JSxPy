// app/pages/documentation.tsx
"use client";
import Link from 'next/link';

export default function Documentation() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Documentation</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold">Auth Process with bcrypt</h2>
        <p>
          Bcrypt is a widely used library for hashing passwords. It uses a cryptographic hashing function that makes it difficult to reverse-engineer the original password from the hash. The hash is stored in the database instead of the plain text password.
        </p>
        <p>
          <strong>Example:</strong>
        </p>
        <pre className="bg-gray-100 p-4 rounded-md">
          {`const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0me$tr0ngP@ssw0rd';

// Hashing a password
bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
  // Store hash in your password DB.
});

// Comparing passwords
bcrypt.compare(myPlaintextPassword, hash, function(err, result) {
  // result is true if the passwords match
});
`}
        </pre>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold">Creating New API Endpoints</h2>
        <p>
          In Next.js, API routes are created by adding files to the `pages/api` directory. Each file corresponds to an endpoint and exports a function to handle requests.
        </p>
        <p>
          <strong>Example:</strong>
        </p>
        <pre className="bg-gray-100 p-4 rounded-md">
          {`// pages/api/hello.js
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello World' });
}
`}
        </pre>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold">Understanding Cookies and JWT</h2>
        <p>
          <strong>Cookies:</strong> Cookies are small pieces of data sent from a server and stored on the client's browser. They are often used for session management and tracking user preferences.
        </p>
        <p>
          <strong>JWT (JSON Web Tokens):</strong> JWTs are a compact, URL-safe means of representing claims between two parties. They consist of a header, payload, and signature, and are commonly used for authentication and authorization.
        </p>
        <p>
          <strong>Example:</strong>
        </p>
        <pre className="bg-gray-100 p-4 rounded-md">
          {`const jwt = require('jsonwebtoken');
const token = jwt.sign({ username: 'user' }, 'secretKey', { expiresIn: '1h' });
const decoded = jwt.verify(token, 'secretKey');
`}
        </pre>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold">In-Depth on Machine Learning</h2>
        <p>
          Machine Learning (ML) involves using data and algorithms to mimic human learning processes. ML models are trained on data to make predictions or decisions without being explicitly programmed for specific tasks.
        </p>
        <p>
          <strong>TFJS (TensorFlow.js):</strong> TensorFlow.js is a JavaScript library for training and deploying machine learning models in the browser and on Node.js. It allows for the creation and use of complex ML models directly in web applications.
        </p>
        <p>
          <strong>TFX (TensorFlow Extended):</strong> TensorFlow Extended is a comprehensive machine learning platform designed for production environments. It includes tools and libraries for managing ML pipelines, including data validation, preprocessing, model training, and deployment.
        </p>
        <p>
          <strong>TFX Addons:</strong> TFX Addons provide additional components and integrations that extend the functionality of TFX, offering more flexibility and capabilities for managing ML workflows.
        </p>
        <p>
          <strong>Example:</strong>
        </p>
        <pre className="bg-gray-100 p-4 rounded-md">
          {`// Basic TensorFlow.js example
import * as tf from '@tensorflow/tfjs';

const model = tf.sequential();
model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);

model.fit(xs, ys, { epochs: 10 }).then(() => {
  model.predict(tf.tensor2d([5], [1, 1])).print();
});
`}
        </pre>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold">Further Reading</h2>
        <ul>
          <li>
            <Link href="https://www.npmjs.com/package/bcrypt" className="relative text-blue-600 hover:text-blue-800">
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-blue-600 transition-transform duration-300 transform scale-x-0 hover:scale-x-100"></span>
              Bcrypt Documentation
            </Link>
          </li>
          <li>
            <Link href="https://nextjs.org/docs/api-routes/introduction" className="relative text-blue-600 hover:text-blue-800">
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-blue-600 transition-transform duration-300 transform scale-x-0 hover:scale-x-100"></span>
              Next.js API Routes
            </Link>
          </li>
          <li>
            <Link href="https://jwt.io/introduction/" className="relative text-blue-600 hover:text-blue-800">
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-blue-600 transition-transform duration-300 transform scale-x-0 hover:scale-x-100"></span>
              JWT Introduction
            </Link>
          </li>
          <li>
            <Link href="https://www.tensorflow.org/js" className="relative text-blue-600 hover:text-blue-800">
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-blue-600 transition-transform duration-300 transform scale-x-0 hover:scale-x-100"></span>
              TensorFlow.js
            </Link>
          </li>
          <li>
            <Link href="https://www.tensorflow.org/tfx" className="relative text-blue-600 hover:text-blue-800">
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-blue-600 transition-transform duration-300 transform scale-x-0 hover:scale-x-100"></span>
              TensorFlow Extended (TFX)
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
