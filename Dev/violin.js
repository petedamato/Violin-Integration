    d3.json("http://localhost:3001/data").then(function(loadin) {
    var thresholdNum = 15
    const parseDate = d3.timeParse("%-m/%-d/%Y")
    const monthFormat = d3.timeFormat("%b")

    const dimensions = loadin.queryResponse.fields.dimension_like
    const measure = loadin.queryResponse.fields.measure_like[0]
    const data = loadin.data

    let data_ready = []

    data.forEach((d)=>{
        let entry = {}
        entry["group"] = d[dimensions[0].name].value
        entry["to_measure"] = d[dimensions[1].name].value
        entry["value"] = d[measure.name].value
        data_ready.push(entry)
    })

    const groupAccessor = d => d.group
    const valueAccessor = d => d.value
    const dateAccessor = d => d.date

    const colors = ["#27566b","#8cbb61","#007b82","#8cbb61","#339f7b","#d8d9dd"]

    const margin = {top: 80, right: 20, bottom: 20, left: 60};
    const width = 600
    const height = 400

    const svg = (
      d3.select("#wrapper").select('svg')
        .html('')
        .attr('width', '100%')
        .attr('height', '100%')
    )

    const group = svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')').attr('width', "100%")
      .attr('height', ((height - margin.top - margin.bottom) + "px")).classed("group", true)

    // // create scales

    // This logic handles when one of the measures is dates

    // const months = d3.timeMonths(...d3.extent(data, dateAccessor))

    // monthNames = []
    // months.forEach(i => {
    //     monthNames.push(monthFormat(i))
    // })


    let buckets = {}
    buckets["label"] = dimensions[0].label
    let bucket_data = []

    if (parseDate(data_ready[0]["group"])) {
        bucket_data = monthNames
        } else {
            data_ready.forEach(function(d){
                if (bucket_data.includes(d.group)) {
                    return
                } else {
                    bucket_data.push(d.group)
                }
            })
    }
    

    buckets["range"] = bucket_data

    const xScale = d3.scaleBand()
        .domain(buckets.range)
        .range([0, width])
        .padding(0.05)

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data_ready, (d)=>{
            return d.value
        }))
        .range([height, 0])

        // Old Process
    const binsGenerator = d3.histogram()
        .domain(yScale.domain())
        .value(d=>d)
        .thresholds(thresholdNum)



        //Nest process
        const groupBins = d3.nest()
            .key(function(d){
                return d.group
            })
            .rollup(function(r) {
              input = r.map(function(g) { return g.value;})    // Keep the variable called Sepal_Length
              bins = binsGenerator(input)   // And compute the binning on it.
              return(bins)
            })
            .entries(data_ready)
    
    // console.log(groupBins, binsGroup)
    
    let yMax = ""
    groupBins.forEach(function(value,key){

        yMax = (value.value[thresholdNum]["x0"])
    })

    yScale.domain([d3.min(data_ready, (d)=>{
            return d.value
        }),yMax])

    let maxNum = 0
    groupBins.forEach((value, key) => {
        const findLengthFrom = value.value
        const lengths = findLengthFrom.map(function(a) {return a.length})
        const longest = d3.max(lengths)
        if (longest > maxNum) {maxNum = longest}
    })



    var xNum = d3.scaleLinear()
        .domain([-maxNum, maxNum])
        .range([0, xScale.bandwidth()])



    // // draw data
    const violins = group.selectAll(".violin")
        .data(groupBins)
        .enter()
        .append("g")
            .attr("transform", function(d) {
                return (`translate(` + xScale(d.key) +` ,0)`)
            })
            .attr("class", "violin")
        .append("path")
            .datum(function(d) {

                    return (d.value)})
            .style("stroke", "none")
            .style("fill", (d,i)=>{
                return colors[i]
            })
            .attr("d", d3.area()
                .x0(function(d) {return xNum(-d.length)})
                .x1(function(d) {return xNum(d.length)})
                .y(function(d) {return yScale(d.x0)})
                .curve(d3.curveCatmullRom))
           

    // // draw peripherals
    const xAxisGenerator = d3.axisBottom()
        .scale(xScale)

    const xAxis = group.append("g")
        .call(xAxisGenerator)
            .style("transform", `translateY(${height}px)`)
            .attr("class", "axis")

    const yAxisGenerator = d3.axisLeft()
        .scale(yScale)

    const yAxis = group.append("g")
        .call(yAxisGenerator)
        .attr("class", "axis")

    const xAxisLabel = xAxis.append("text")
        .attr("x", width/2)
        .attr("y", margin.bottom*2)
        .attr("fill", "black")
        .style("font-size", "1.4em")
        .text((d)=>{
            return buckets.label
        })
        .style("text-anchor", "middle")
    const yAxisLabel = yAxis.append("text")
        .attr("x", (-width/2) + margin.top)
        .attr("y", -margin.left + 18)
        .attr("fill", "black")
        .style("font-size", "1.4em")
        .text((d)=>{
            return measure.label
        })
        .style("transform", "rotate(-90deg)")
        .style("text-anchor", "middle")

})