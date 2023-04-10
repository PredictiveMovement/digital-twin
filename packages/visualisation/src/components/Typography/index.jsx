import styled from 'styled-components'

const Paragraph = styled.p`
  margin: 0;
  font-weight: ${(props) => (props.thin ? 300 : 400)};
  font-size: 12px;
  font-family: 'Helvetica Neue', sans-serif;
  color: ${(props) => (props.white ? 'white' : 'black')};
`

const ParagraphBold = styled(Paragraph)`
  font-weight: bold;
`

const ParagraphLarge = styled.p`
  color: ${(props) => (props.white ? 'white' : 'black')};
  font-family: 'Helvetica Neue', sans-serif;
  margin: 0;
  font-size: 16px;
`

const H1 = styled.h1`
  font-size: ${(props) => (props.large ? '24px' : '20px')};
  font-weight: 700;
  margin: 0;
`

const H2 = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`

const H3 = styled.h3`
  font-size: 14px;
  margin: 0;
`

const H4 = styled.h4`
  margin: 0;
  font-size: 14px;
`

const H5 = styled.h5`
  margin: 0;
`

export { Paragraph, ParagraphBold, ParagraphLarge, H1, H2, H3, H4, H5 }
