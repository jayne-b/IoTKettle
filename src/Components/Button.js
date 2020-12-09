import React from 'react'

const Button = ({ handleClick, text, image }) => {
    return (
        <button onClick={handleClick} id={image} >
            <div><img src={image} alt={text}></img><div><b>{text}</b></div></div>
        </button>
    )
}

export default Button
