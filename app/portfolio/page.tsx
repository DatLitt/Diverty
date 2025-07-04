"use client";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { styled } from "@mui/material";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useState } from "react";
import Step1 from "../components/Step1";
import Step2 from "../components/Step2";
import Step3 from "../components/Step3";
import { useData } from "../context/DataContext";
import styles from "./page.module.css";
import { StockDetails } from "../types/test";

const CustomTab = styled(Tab)(() => ({
  backgroundColor: "var(--neutral-200)",
  textTransform: "none",
  fontWeight: 500,
  padding: "12px 0",
  flex: 1,
  fontFamily: "Jura, sans-serif",
  borderRadius: "10px",
  "&.Mui-disabled": {
    cursor: "not-allowed",
    backgroundColor: "var(--neutral-200)",
  },
  "&.Mui-selected": {
    backgroundColor: "var(--neutral-100)",
    color: " var(--primary)",
    borderRadius: "10px 10px 0 0",
  },
}));

export default function Portfolio() {
  const [startDate, setStartDate] = useState(
    dayjs().subtract(5, "year").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [interval, setInterval] = useState("1wk");
  const [optimizationType, setOptimizationType] = useState<
    "riskConstrained" | "minRisk" | "returnConstrained" | "noRiskLimit"
  >("riskConstrained");
  const [constraintValue, setConstraintValue] = useState(5);
  const [selectedStocks, setSelectedStocks] = useState<StockDetails[]>([]);
  const [minWeights, setMinWeights] = useState<number[]>([]);
  const [maxWeights, setMaxWeights] = useState<number[]>([]);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(
    new Set()
  );

  const { data, bestPortfolio } = useData();

  const [value, setValue] = useState("1");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className={styles.container} id="myDiv">
        <Box
          sx={{
            width: "100%",
            typography: "body1",
            fontFamily: "'Jura', sans-serif",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TabContext value={value}>
            <Box
              sx={{
                borderBottom: "none",

                width: "100%",
              }}
            >
              <TabList
                onChange={handleChange}
                aria-label="lab API tabs example"
                className={styles.tabList}
                variant="fullWidth"
                slotProps={{
                  indicator: {
                    sx: {
                      display: "none",
                    },
                  },
                }}
              >
                <CustomTab label="Selection" value="1" />
                <CustomTab
                  label="Configuration"
                  value="2"
                  disabled={data?.length === 0}
                />
                <CustomTab
                  label="Results"
                  value="3"
                  disabled={
                    !bestPortfolio?.fitness || bestPortfolio?.fitness < 0
                  }
                />
              </TabList>
            </Box>
            <div className={styles.tabContent}>
              <TabPanel value="1" sx={{ padding: 0, height: "100%" }}>
                <Step1
                  setValue={setValue}
                  setMinWeights={setMinWeights}
                  setMaxWeights={setMaxWeights}
                  selectedStocks={selectedStocks}
                  setSelectedStocks={setSelectedStocks}
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  interval={interval}
                  setInterval={setInterval}
                />
              </TabPanel>
              <TabPanel value="2" sx={{ padding: 0, height: "100%" }}>
                <Step2
                  setMinWeights={setMinWeights}
                  setMaxWeights={setMaxWeights}
                  setValue={setValue}
                  minWeights={minWeights}
                  maxWeights={maxWeights}
                  optimizationType={optimizationType}
                  setOptimizationType={setOptimizationType}
                  constraintValue={constraintValue}
                  setConstraintValue={setConstraintValue}
                  expandedIndices={expandedIndices}
                  setExpandedIndices={setExpandedIndices}
                />
              </TabPanel>
              <TabPanel value="3" sx={{ padding: 0, height: "100%" }}>
                <Step3 />
              </TabPanel>
            </div>
          </TabContext>
        </Box>

        {bestPortfolio?.fitness < 0 && (
          <div>
            <p style={{ color: "red" }}>
              No valid portfolio found with the given constraints.
            </p>
          </div>
        )}
      </div>
    </LocalizationProvider>
  );
}
