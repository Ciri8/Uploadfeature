const form = document.querySelector("form"); // finds the first form element and stores it in the var "form"
const fileInput = document.querySelector(".file-input"); //  finds the class "file input" and stores it in file input to find the class
const progressArea = document.querySelector(".progress-area"); // finds the element with the class called 'progress-area' and stores it in "progressArea"
const uploadedArea = document.querySelector(".uploaded-area"); //  finds the elemnt with the class called 'uploaded-area' and stores it in 'uploadedArea'

form.addEventListener("click", () => {
  fileInput.click();
});
// once the form is clicked, it triggers a click event on the file input element which opens the file explorer

fileInput.onchange = ({ target }) => {
  let file = target.files[0]; // Retrieve the selected file
  if (file) {
    let fileName = file.name; // Get the name of the file
    if (fileName.length >= 12) {
      let splitName = fileName.split('.'); // Splits the file name into two parts: name and extension
      fileName = splitName[0].substring(0, 13) + "... ." + splitName[1]; // this shortens the name if its too long 
    }
    uploadFile(fileName); // Calls the 'uploadFile' function and pass the modified file name
  }
};
// When a file is selected, this code block is executed. It retrieves the selected file,
// modifies its name if necessary, and calls the 'uploadFile' function with the modified name.

function uploadFile(name) {
  let xhr = new XMLHttpRequest(); // Create a new XMLHttpRequest object(this transmits requests from webpage to webserver)
  xhr.open("POST", "/upload");
 // Open a POST request to the specified URL(this is the nodejs version)
  xhr.upload.addEventListener("progress", ({ loaded, total }) => {
    let fileLoaded = Math.floor((loaded / total) * 100); // Calculate the percentage of file loaded(might need to change this later depending on file size)
    let fileTotal = Math.floor(total / 1000); // Calculate the total file size in KB
    let fileSize;
    // Determine the file size in either KB or MB, based on its total size
    (fileTotal < 1024) ? fileSize = fileTotal + " KB" : fileSize = (loaded / (1024 * 1024)).toFixed(2) + " MB";

    let progressHTML = `<li class="row"> <!-- Creating an HTML string -->
      <i class="fas fa-file-alt"></i>
      <div class="content">
        <div class="details">
          <span class="name">${name} • Uploading</span>
          <span class="percent">${fileLoaded}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress" style="width: ${fileLoaded}%"></div>
        </div>
      </div>
    </li>`;
    // Create HTML code to display the progress of the file upload

    uploadedArea.classList.add("onprogress"); // Add the class 'onprogress' to the 'uploadedArea' element
    progressArea.innerHTML = progressHTML; // Set the innerHTML of 'progressArea' to the progress HTML code

    if (loaded == total) {
      progressArea.innerHTML = ""; // Clear the progress HTML code
      let uploadedHTML = `<li class="row"> <!-- Creating an HTML string -->
        <div class="content upload">
          <i class="fas fa-file-alt"></i>
          <div class="details">
            <span class="name">${name} • Uploaded</span>
            <span class="size">${fileSize}</span>
          </div>
        </div>
        <i class="fas fa-check"></i>
      </li>`;
      //  all this thml code just shows the progress of the file info

      uploadedArea.classList.remove("onprogress"); // Remove the class 'onprogress' from the 'uploadedArea' element
      uploadedArea.insertAdjacentHTML("afterbegin", uploadedHTML); // Insert the uploaded HTML code at the beginning of 'uploadedArea'
    }
  });
  // Add a progress event listener to track the file upload progress

  let data = new FormData(form); // Create a new FormData object and pass the 'form' element
  xhr.send(data); // Send the form data using the XMLHttpRequest object
}
// This function handles the file upload process. It creates an XMLHttpRequest,
// sets up a progress event listener, prepares the form data, and sends it to the server.
