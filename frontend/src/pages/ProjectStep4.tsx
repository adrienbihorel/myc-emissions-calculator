import React, {useState, useEffect} from 'react'
import { useKeycloak } from "@react-keycloak/web"
import { useParams, useNavigate } from "react-router-dom"
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import InputGroup from 'react-bootstrap/InputGroup'
import {InputStep4, ProjectType} from '../frontendTypes'
import Progress from '../components/Progress'


import './Project.css'


export default function ProjectStep4(){
    const { keycloak, initialized } = useKeycloak();
    const navigate = useNavigate()
    let params = useParams();
    let [inputData, setInputData ] = useState({source: ''} as InputStep4)
    let [project, setProject ] = useState({} as ProjectType)
    let projectId = params.projectId
    useEffect(() => {
        if (initialized && keycloak.authenticated){
            const requestOptions = {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + keycloak.token }
            };
            fetch(process.env.REACT_APP_BACKEND_API_BASE_URL + '/api/project/' + projectId, requestOptions)
                .then(response => response.json())
                .then(data => {
                    console.log("get projetcs reply", data)
                    setProject(data.project)
                    let vtypes = Object.keys(data.project.inputStep2)
                    let init:InputStep4 = {source: data.project.inputStep4?.source || ''}
                    for (let i = 0; i < vtypes.length; i++) {
                        let vtype = vtypes[i]
                        if (data.project.inputStep4?.[vtype]){
                            init[vtype] = data.project.inputStep4[vtype]
                        } else {
                            init[vtype] = {
                                occupancy: "0"
                            }
                        }
                    }
                    setInputData(init)
                });
            }
    }, [keycloak, initialized, projectId])
    const updateSource = (event: React.BaseSyntheticEvent) => {
        setInputData((prevInputData: InputStep4) => ({
            ...prevInputData,
            source: event.target.value
        }))
    }
    const updateInput = (vtype: string, param: "occupancy", value: string) => {
        setInputData((prevInputData: InputStep4) => {
            let vtypeobj = prevInputData[vtype]
            if (vtypeobj && typeof(vtypeobj) !== 'string') {
                vtypeobj[param] = value
                return {
                    ...prevInputData,
                    [vtype]: vtypeobj
                }
            } else {
                return prevInputData
            }
        })
    }
    const updateOccupancy = (event: React.BaseSyntheticEvent) => {
        let target = event.target as HTMLInputElement
        let vtype = target.name
        let value = target.value
        updateInput(vtype, "occupancy", value)
    }
    const goPreviousStep = () => {
        navigate('/project/' + projectId + '/step/3');
    }
    const saveAndGoNextStep = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const requestOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + keycloak.token },
            body: JSON.stringify({ inputData: inputData })
        };
        fetch(process.env.REACT_APP_BACKEND_API_BASE_URL + '/api/project/' + projectId + '/step/4', requestOptions)
            .then(response => response.json())
            .then(() => navigate('/project/' + projectId + '/step/5'));
    }
    return (
        <Container className="projectStepContainer">
            <Progress project={project} currentStep={4} />
            <Row className="justify-content-md-center align-items-center" style={{minHeight: "calc(100vh - 200px)", marginTop: "20px"}}>
                <Col xs lg="8">
                    <h1>Set up occupancy</h1>
                    <h2 style={{marginTop: "-40px", marginBottom: "40px"}}>{project.name}</h2>
                    <h2>Please enter the occupancy for passenger vehicles (average number of passengers per vehicle)</h2>
                    <Form onSubmit={saveAndGoNextStep}>
                        <Table className="inputTable">
                            <thead>
                                <tr>
                                    <th>Vehicle type</th>
                                    <th>Average occupancy (number of passengers)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(project.inputStep2 || []).map((vtype, index) => {
                                    let vt = vtype
                                    if (!project.inputStep2 || project.inputStep2[vt] === false || !inputData) {
                                        return <></>
                                    }
                                    let inputVt = inputData[vt]
                                    if (inputVt && typeof(inputVt) !== 'string')
                                        return (
                                            <tr key={index}>
                                                <td style={{backgroundColor: "#989898"}}>{vtype}</td>
                                                <td><Form.Control type="number" required min="0" step="0.1" name={vtype} value={inputVt.occupancy} onChange={updateOccupancy} placeholder="" /></td>
                                            </tr>
                                        )
                                    return <></>
                                })
                                }

                            </tbody>
                        </Table>
                        {inputData?
                            <Form.Group as={Row} style={{"marginBottom": "20px"}}>
                                <Form.Label column sm={2}>Source</Form.Label>
                                <Col sm={10}>
                                    <Form.Control type="input" name="vktSource" value={inputData.source as string} onChange={updateSource} placeholder=""/>
                                </Col>
                            </Form.Group>
                        :''}

                        <h2>Need some help to find the data, <a href="mailto:contact@myc.com">click here to send us an email</a></h2>
                        <Button variant="secondary" style={{marginRight: "20px"}} onClick={goPreviousStep}>
                            Previous
                        </Button>
                        <Button variant="primary" type="submit">
                            Next
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>

    )
}
