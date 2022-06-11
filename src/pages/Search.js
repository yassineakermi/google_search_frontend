import React, { useEffect, useState } from 'react'

var axios = require('axios');

const Search = () => {

    const [keywords, setKeywords] = useState("")
    const [language, setLanguage] = useState("")
    const [country, setCountry] = useState("")
    const [results, setResults] = useState([])
    const [processing, setProcessing] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // useEffect(_ => {
    //     setTotalPages(parseInt(results.length / 50) + 1)
    //     if (results.length === keywords.split('\n').length) {
    //         setProcessing(false)
    //         setKeywords("")
    //     }
    // }, [results])
    const handlChange = (event) => {
        if (event.target.id === "keywords")
            setKeywords(event.target.value)
        if (event.target.id === "language")
            setLanguage(event.target.value)
        if (event.target.id === "country")
            setCountry(event.target.value)
    }

    const parseKeyword = async (e) => {
        e.preventDefault();
        setProcessing(true)
        setResults([])
        for (const keyword of keywords.split('\n')) {
            try {
                const options = {
                    method: 'post',
                    url: "http://localhost:3001/parse_keyword",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        "keyword": keyword,
                        "language": language,
                        "country": country
                    })
                }
                let response = await axios(options);
                if (response?.data instanceof Array) {
                    setResults((prevResults) => [...prevResults, { keyword: keyword, id: response.data.length > 0 ? response.data[0].id : keyword, results: response.data, error: "" }]);
                }
                else if (response?.data?.createdAT || response?.data?.processing) {
                    checkKeywordStatus(response.data.id, keyword);
                }
            } catch (ex) {
                console.log(ex);
                setResults((prevResults) => [...prevResults, { keyword: keyword, id: null, results: "", error: "Error while scraping keyword " + keyword.toString() }]);
            }
        }
    }

    const checkKeywordStatus = async (id, keyword) => {
        const interval = setInterval(async function () {
            try {
                let response = await axios.get(`http://localhost:3001/check_status/${id}`)
                if (response?.data?.error) {
                    setResults((prevResults) => [...prevResults, { keyword: keyword, id: id, results: "", error: response.data.error }])
                    clearInterval(interval)
                }
                else if (response?.data instanceof Array) {
                    setResults((prevResults) => [...prevResults, { keyword: keyword, id: id, results: response.data, error: "" }])
                    clearInterval(interval)
                }
            } catch (ex) {
                console.log(ex)
                setResults((prevResults) => [...prevResults, { keyword: keyword, id: id, results: "", error: "Error while scraping keyword " + keyword.toString() }]);
                clearInterval(interval)
            }
        }, 6000);
    }

    const handlePaginationChange = (e) => {
        console.log(e.target)
        setCurrentPage(parseInt(e.target.text))
    }
    const createPagination = (pagesCount) => {
        const elements = []
        for (let page = 1; page <= pagesCount; page++) {
            elements.push(<li onClick={handlePaginationChange}  key={page} class="page-item"><a class="page-link" href="#">{page}</a></li>)
        }
        return elements
    }
    return (

        <div className="form-group" style={{ display: "flex", justifyContent: "space-around", paddingTop: "2%" }}>
            <form onSubmit={parseKeyword} style={{ felx: "0.5", width: "80%" }}>
                <div style={{ marginBottom: "20px" }} className="col col-8">
                    <label htmlFor="keywords" className="form-label">Keyword</label>
                    <textarea rows={3} className="form-control" id="keywords" placeholder="Enter keywords..." onChange={handlChange} value={keywords} />
                </div>
                <div style={{ marginBottom: "20px" }} className="col col-8">
                    <label htmlFor="language" className="form-label">Select a language(opional)</label>
                    <select value={language} onChange={handlChange} className="form-select" id="language" aria-label="Default select example">
                        <option selected value={""}>Default</option>
                        <option value={"en"}>EN</ option>
                        <option value={"fr"}>FR</option>
                    </select>
                </div>

                <div style={{ marginBottom: "20px" }} className="col col-8">
                    <label htmlFor="country" className="form-label">Select a country(opional)</label>
                    <select value={country} onChange={handlChange} className="form-select" id="country" aria-label="Default select example">
                        <option selected value={""}>Default</option>
                        <option value={"us"}>United States</option>
                        <option value={"ca"}>Canada</option>
                    </select>
                </div>
                {
                    processing ?

                        <button class="btn btn-primary" type="button" disabled>
                            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"> </span>
                            Analysing...
                        </button>
                        :

                        <button style={{ marginBottom: "20px" }} type="submit" class="btn btn-primary">Analyse</button>
                }
                {
                    <div className="accordion" id="accordionExample">

                        {results.slice(((currentPage - 1) * 50), (currentPage * 50)).map((rs, index) => {
                            return <div key={index} className="accordion-item">
                                <h2 className="accordion-header" id={"accordion" + index}>
                                    <button className={"accordion-button " + (index !== 0 ? "collapsed" : "")} type="button" data-bs-toggle="collapse" data-bs-target={"#collapse" + index} aria-expanded="true" aria-controls={"collapse" + index}>
                                        {rs.keyword}
                                    </button>
                                </h2>

                                <div id={"collapse" + index} className={"accordion-collapse collapse " + (index === 0 ? "show" : "")} aria-labelledby={"heading" + index} data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        {
                                            rs.error ? <span>{rs.error}</span> :
                                                rs.results.map(res => <div style={{ display: "flex", justifyContent: "space-between" }} ><a target={'_blank'} href={res.link.replace('/url?esrc=s&q=&rct=j&sa=U&url=', '')} key={res.id}>{res.title}</a><span>{"Rank #" + res.rank}</span></div>)
                                        }

                                    </div>
                                </div>
                            </div>

                        })}
                    </div>

                }


                <nav aria-label="Page navigation example">
                    <ul class="pagination">
                        {
                            createPagination(parseInt(results.length / 50) + 1)
                        }
                    </ul>
                </nav>


            </form>


        </div>

    )
}

export default Search