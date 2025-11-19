import React, { useState, useEffect } from "react";
import MedicalDetails from "../../Components/EnrolmentForm/MedicalDetails";
import FamilyDetailsPhase2 from "../../Components/EnrolmentForm/FamilyDetailsPhase2";
import FamilyDetailsPhase3 from "../../Components/EnrolmentForm/FamilyDetailsPhase3";
import PersonalInfoAndDeclaration from "../../Components/EnrolmentForm/PersonalInfoAndDeclaration";
import StudentDetails from "../../Components/EnrolmentForm/StudentDetails";
import SectionHeader from "../../Components/SectionHeader";
import { useEnrolmentForm } from "../../Context/EnrolmentFormContext";

const EnrolmentForm = () => {
  const { error, success } = useEnrolmentForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const steps = [
    { component: StudentDetails, title: "Student details" },
    {
      component: MedicalDetails,
      title: "Student Medical Details",
    },
    {
      component: FamilyDetailsPhase2,
      title: "Family details - Contact Information",
    },
    {
      component: FamilyDetailsPhase3,
      title: "Emergency Contact Details",
    },
    {
      component: PersonalInfoAndDeclaration,
      title: "Personal information and declaration of accuracy",
    },
  ];

  // Effect to handle showing success message WITHOUT immediate reset
  useEffect(() => {
    if (success) {
      setShowSuccess(true);
      
      // Hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShowSuccess(false);
    }
  }, [success]);

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const CurrentComponent = steps[currentStep].component;

  return (
    <>
      <div className="container-fluid px-4 py-3">
        <h3 className="mb-0 mt-3 fw-bold text-center">
          Student enrolment and parent/carer consent form
        </h3>
        
        {/* Progress Indicator - Numbered Circles */}
        <div className="container d-md-flex justify-content-center align-items-center py-4">
          <div className="row">
            <div className="col-12">
              <div className="d-flex justify-content-center align-items-center mb-3">
                <div className="d-flex align-items-center">
                  {steps.map((step, index) => {
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;

                    return (
                      <React.Fragment key={index}>
                        {/* Step Circle */}
                        <div
                          className={`progress-circle rounded-circle d-flex align-items-center justify-content-center fw-bold ${
                            isCompleted
                              ? "dark-green-bg text-white"
                              : "border border-secondary bg-white text-secondary"
                          }`}
                          style={{
                            borderWidth: "2px",
                            boxShadow: isCurrent ? "0 0 0 3px #295b66" : "none",
                          }}
                        >
                          {index + 1}
                        </div>

                        {index < steps.length - 1 && (
                          <div
                            className={`mx-2 progress-line ${
                              isCompleted ? "dark-green-bg" : "bg-light"
                            }`}
                          ></div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-4">
          <div className="row">
            <div className="col-lg-10 p-0">
              <h5 className="dark-text text-secondary mb-3">
                This enrolment and parent/carer consent form is to be completed
                in English.
              </h5>
              <p className="text-muted">
                Student details provided on the form should match those provided
                to the student's day school. A separate form is to be completed
                for each student annually.
              </p>
            </div>
          </div>
        </div>

        {/* Global Status Messages */}
        {error && (
          <div className="container">
            <div className="alert alert-danger" role="alert">
              Error: {error}
            </div>
          </div>
        )}

        {showSuccess && (
          <div className="container">
            <div className="alert alert-success" role="alert">
              Student enrollment submitted successfully!
            </div>
          </div>
        )}

        {/* Form Body */}
        <div>
          <SectionHeader title={steps[currentStep].title} />
          <CurrentComponent onNext={handleNext} />

          {/* Navigation Buttons */}
          {currentStep > 0 && (
            <div className="container py-3 px-0">
              <div className="row">
                <div className="col-12 d-flex justify-content-between z-2">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="btn globalbutton rounded-0 dark-text fw-bold fs-5 position-relative overflow-hidden"
                  >
                    Previous Step
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EnrolmentForm;