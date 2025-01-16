import React, { useState, useEffect } from "react";
import TabsTeachers from "./designelements/tabforall";
import Tables from "./designelements/tables";
import TextField from "@mui/material/TextField";
import { Box, Button, FormControl } from "@mui/material";
import Singledropdown from "./designelements/singledropdown";
import AlertDialogModal from "./designelements/modal";
import CustomSnackbar from "./designelements/alert";
import CourseService from "./api/courseService";
import BatchService from "./api/batchService";
import Checkboxx from "./designelements/checkbox";

function Course() {
  // -----------------------------
  // Snackbar State
  // -----------------------------
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarColor, setSnackbarColor] = useState("neutral"); // success, danger, etc.

  // -----------------------------
  // Course Form Data
  // -----------------------------
  const [courseData, setCourseData] = useState({
    Course_code: "",
    Course_name: "",
    Batch_ID: "",             // must store an integer PK
    Max_classes_per_day: "",
    Credit_hours: "",
    Course_desc: "",
  });

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);

  // Data from the server
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);

  // Tab control
  const [currentTab, setCurrentTab] = useState(0);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseIdToDelete, setCourseIdToDelete] = useState(null);

  // -----------------------------
  // On Mount
  // -----------------------------
  useEffect(() => {
    fetchAllCourses();
    fetchAllBatches();
  }, []);

  const fetchAllCourses = async () => {
    try {
      const response = await CourseService.getAllCourses(); 
      // e.g. [ { Course_ID: 1, Course_code: 'ABC', Batch_ID: 10, ...}, ...]
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      showSnackbar("Failed to fetch courses.", "danger");
    }
  };

  const fetchAllBatches = async () => {
    try {
      const response = await BatchService.getAllBatches();
      // e.g. [ { Batch_ID: 10, Batch_name: '2021', ...}, { Batch_ID: 11, Batch_name: '2022', ...} ]
      setBatches(response.data);
    } catch (error) {
      console.error("Error fetching batches:", error);
      showSnackbar("Failed to fetch batches.", "danger");
    }
  };

  // -----------------------------
  // Table
  // -----------------------------
  const tableHeadings = [
    "Course Code",
    "Course Name",
    "Batch",
    "Max Classes per Day",
    "Credit Hours",
    "Description",
    "Course Type",
    "Actions",
  ];

  // Convert courses into table rows
  const tableRows = courses.map((course) => {
    // Real PK might be course.Course_ID or course.id
    const pk = course.Course_ID; 
    // find matching batch
    const foundBatch = batches.find((b) => b.Batch_ID === course.Batch_ID);

    return [
      course.Course_code,
      course.Course_name,
      foundBatch ? foundBatch.Batch_name : "N/A",
      course.Max_classes_per_day,
      course.Credit_hours,
      course.Course_desc,
      course.Is_Lab ? "Lab+Theory Course" : "Theory Only Course",
      pk, // last item used for edit/delete
    ];
  });

  // -----------------------------
  // Edit
  // -----------------------------
  const handleEdit = async (rowData) => {
    const courseId = rowData[rowData.length - 1]; 
    if (!courseId) {
      showSnackbar("No valid course ID for editing.", "danger");
      return;
    }
    try {
      const resp = await CourseService.getCourseById(courseId);
      const foundCourse = resp.data; 
      // e.g. { Course_code, Course_name, Batch_ID, Max_classes_per_day, Credit_hours, Course_desc }

      setCourseData({
        Course_code: foundCourse.Course_code || "",
        Course_name: foundCourse.Course_name || "",
        Batch_ID: foundCourse.Batch_ID || "",   // store the integer PK
        Max_classes_per_day: foundCourse.Max_classes_per_day?.toString() || "",
        Credit_hours: foundCourse.Credit_hours?.toString() || "",
        Course_desc: foundCourse.Course_desc || "",
        Is_Lab: !!foundCourse.Is_Lab,
      });

      setIsEditing(true);
      setEditingCourseId(courseId);
      setCurrentTab(1); 
    } catch (error) {
      console.error("Error fetching course for edit:", error);
      const msg =
        error.response?.data?.detail || "Failed to fetch course for edit.";
      showSnackbar(msg, "danger");
    }
  };

  // -----------------------------
  // Delete
  // -----------------------------
  const handleDeleteClick = (rowData) => {
    const courseId = rowData[rowData.length - 1];
    setCourseIdToDelete(courseId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!courseIdToDelete) return;
    try {
      await CourseService.deleteCourse(courseIdToDelete);
      showSnackbar("Course deleted successfully!", "success");
      fetchAllCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      const msg =
        error.response?.data?.detail || "Failed to delete the course.";
      showSnackbar(msg, "danger");
    } finally {
      setDeleteModalOpen(false);
      setCourseIdToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setCourseIdToDelete(null);
  };

  // -----------------------------
  // Create or Update
  // -----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // This object has the correct numeric "Batch_ID" 
      // e.g. { Course_code: 'XYZ', Batch_ID: 10, ... }
      const payload = {
        ...courseData,
        Is_Lab: !!courseData.Is_Lab,
        Batch_ID: parseInt(courseData.Batch_ID, 10) || null, 
      };
      console.log(payload)
      if (isEditing && editingCourseId) {
        await CourseService.updateCourse(editingCourseId, payload);
        showSnackbar("Course updated successfully!", "success");
      } else {
        await CourseService.createCourse(payload);
        showSnackbar("Course created successfully!", "success");
      }
      fetchAllCourses();
      resetForm();
    } catch (error) {
      console.error("Error creating/updating course:", error.response?.data);
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        "An error occurred while saving the course.";
      showSnackbar(msg, "danger");
    }
  };

  const resetForm = () => {
    setCourseData({
      Course_code: "",
      Course_name: "",
      Batch_ID: "",
      Max_classes_per_day: "",
      Credit_hours: "",
      Course_desc: "",
    });
    setIsEditing(false);
    setEditingCourseId(null);
    setCurrentTab(0);
  };

  // -----------------------------
  // Show Snackbar
  // -----------------------------
  const showSnackbar = (message, color) => {
    setSnackbarMessage(message);
    setSnackbarColor(color);
    setSnackbarOpen(true);
  };

  // -----------------------------
  // Build Tab Content
  // -----------------------------
  const tabLabels = ["View list of courses", "Enter new course"];

  const tableContent = (
    <Tables
      tableHeadings={tableHeadings}
      tableRows={tableRows}
      onEdit={handleEdit}
      onDelete={handleDeleteClick}
    />
  );

  const formContent = (
    <form onSubmit={handleSubmit}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 3,
          maxWidth: 1000,
          margin: "0 auto",
          padding: 4,
          borderRadius: 2,
          boxShadow: 4,
          backgroundColor: "#f5f5f5",
        }}
      >
        <TextField
          label="Course Code"
          variant="outlined"
          type="text"
          fullWidth
          required
          value={courseData.Course_code}
          onChange={(e) =>
            setCourseData({ ...courseData, Course_code: e.target.value })
          }
        />
        <TextField
          label="Course Name"
          variant="outlined"
          type="text"
          fullWidth
          required
          value={courseData.Course_name}
          onChange={(e) =>
            setCourseData({ ...courseData, Course_name: e.target.value })
          }
        />
        <TextField
          label="Course Description"
          variant="outlined"
          type="text"
          fullWidth
          required
          value={courseData.Course_desc}
          onChange={(e) =>
            setCourseData({ ...courseData, Course_desc: e.target.value })
          }
        />
        <TextField
          label="Max classes per day"
          variant="outlined"
          type="number"
          fullWidth
          required
          value={courseData.Max_classes_per_day}
          onChange={(e) =>
            setCourseData({
              ...courseData,
              Max_classes_per_day: e.target.value,
            })
          }
        />
        <FormControl fullWidth required>
        <FormControl fullWidth required>
  <Singledropdown
    name="credit-hours"
    label="Credit Hours"
    value={courseData.Credit_hours} // Controlled state
    onChange={(selectedValue) => {
      // Update state with the selected value
      setCourseData({ ...courseData, Credit_hours: selectedValue });
    }}
    menuItems={[
      { label: '1 Hour', value: '1' },
      { label: '2 Hours', value: '2' },
      { label: '3 Hours', value: '3' },
      { label: '4 Hours', value: '4' },
    ]}
    required
  />
</FormControl>

        </FormControl>
        <FormControl fullWidth required>
  <Singledropdown
    label="Batch"
    menuItems={batches.map((b) => ({
      label: b.Batch_name, // Displayed in the dropdown
      value: b.Batch_ID,   // Actual value sent to the backend
    }))}
    value={courseData.Batch_ID}
    onChange={(selectedValue) => {
      // Log for debugging
      console.log("Selected Batch ID:", selectedValue);
      // Update state
      setCourseData({ ...courseData, Batch_ID: selectedValue });
    }}
  />
</FormControl>
<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
<Checkboxx
  label="This is a Lab course"
  checked={!!courseData.Is_Lab} // Ensure it's always a boolean
  onChange={(checkedVal) =>
    setCourseData({ ...courseData, Is_Lab: checkedVal })
  }
/>

  </Box>

        <Box sx={{ gridColumn: "span 2", textAlign: "center", mt: 2 }}>
          <Button variant="contained" color="primary" type="submit" fullWidth>
            {isEditing ? "Update Course" : "Submit"}
          </Button>
        </Box>
      </Box>
    </form>
  );

  return (
    <div>
      {/* Snackbar */}
      <CustomSnackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        color={snackbarColor}
      />

      {/* Tabs */}
      <TabsTeachers
        tabLabels={tabLabels}
        tabContent={[tableContent, formContent]}
        externalIndex={currentTab}
        onIndexChange={(val) => setCurrentTab(val)}
      />

      {/* Delete Modal */}
      <AlertDialogModal
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        message="Are you sure you want to delete this course?"
      />
    </div>
  );
}

export default Course;
