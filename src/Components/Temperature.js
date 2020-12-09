import React from 'react'

const Temperature = ({ text, value, scale }) => {
    return (
        <p><b>{text}:</b> {value} {scale}</p>

        )
}

export default Temperature
