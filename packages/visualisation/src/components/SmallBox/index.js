import * as React from 'react';
import styled from 'styled-components'
import ProgressBar from '../ProgressBar';

const Wrapper = styled.div`
    background-color: #10C57B;
    margin: 0;
    border-radius: 5px;
    padding: 1rem;
`
const Paragraph = styled.p`
margin: 0;
font-family: 'Roboto', sans-serif;
font-weight: ${(props) => props.thin ? 300 : 400};
color: white;
`

function SmallBox({ popupInfo }) {
    return (
        <Wrapper>
            <div style={{ marginBottom: '1rem' }}>
                <Paragraph>{popupInfo.type === 'hub' ? 'Postombud' : popupInfo.type === 'booking' ? 'Bokning' : 'Lastbil'}</Paragraph>
                
            </div>
            <div>
                <Paragraph thin>Fyllnadsgrad</Paragraph>
                <ProgressBar completed={30} />
            </div>
        </Wrapper>
    );
}

export default React.memo(SmallBox);