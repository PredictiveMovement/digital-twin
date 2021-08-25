import React from 'react';
import styled from 'styled-components'
import menuIcon from '../../icons/menu.svg'

const StyledButton = styled.button`
position: absolute;
cursor: pointer;
border: none;
bottom: 6rem;
right: 4rem;
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
