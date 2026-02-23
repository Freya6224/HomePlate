import React, {useState,ChangeEvent,FormEvent}from "react";
import { useNavigate } from "react-router-dom";

const signup = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    });
    const handleChange = (e: ChangeEvent<HTMLInputElement>) =>{
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };
    const handleSubmit = (e: FormEvent) =>{
        e.preventDefault();
        if(formData.password!==formData.confirmPassword)
        {
            alert("Passwords do not match.");
            return;
        }
        console.log("Sign up Data:", formData);
        navigate("/signin");
    };

    return (
<div>

</div>
    );
};

export default signup;