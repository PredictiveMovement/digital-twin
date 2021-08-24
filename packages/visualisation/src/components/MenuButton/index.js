import React from 'react';
import styled from 'styled-components'
import menuIcon from '../../icons/menu.svg'

const StyledButton = styled.button`
cursor: pointer;
border-radius: 50%;
border: none;
height: 70px;
width: 70px;
background-color: inherit;
`

const MenuButton = ({ onClick }) => {
    return (
        <StyledButton onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            onClick()
        }}> <img src={menuIcon} alt={'Meny'} /></StyledButton>
    )
}

export default MenuButton;
