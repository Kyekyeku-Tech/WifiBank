import React from 'react'
import { Link } from 'react-router-dom'


export default function UserHome(){
return (
<div className="max-w-4xl mx-auto text-center">
<h1 className="text-3xl font-bold mb-4">Starlink Packages</h1>
<p className="mb-6">Affordable Starlink access — choose a package and pay securely.</p>
<Link to="/packages" className="inline-block bg-blue-600 text-white px-4 py-2 rounded">View Packages</Link>
</div>
)
}