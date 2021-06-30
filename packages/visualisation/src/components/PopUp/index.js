import React from 'react';
import styled from 'styled-components'

const Wrapper = styled.div`
position: absolute;
top: 10px;
left: 10px;
background-color: #ffffff;
padding: 8px;
`

const CloseButton = styled.button`
cursor: pointer;
background-color: #ffffff;
border: none;
`

const FlexEnd = styled.div`
display: flex;
justify-content: flex-end;
`

const PopUp = ({ popUpInfo, onClick }) => {
    return (
        <Wrapper>
            <FlexEnd>
                <CloseButton onClick={() => onClick(null)}>X</CloseButton>
            </FlexEnd>
            <pre>{JSON.stringify(popUpInfo, null, 2)}</pre>
        </Wrapper>
    )
}

export default PopUp;