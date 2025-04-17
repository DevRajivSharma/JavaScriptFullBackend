class ApiResponse {
    constructor(
        statusCode,
        message = "Success",
        data
    ){
        this.message = message;
        this.statusCode = statusCode;
        this.data = data;
        this.success = statusCode < 400;
    }
}

// const test = new ApiResponse(200,"Successfully created user",{id:"12345",username:"John Doe"})
// console.log(typeof test);

export default ApiResponse;