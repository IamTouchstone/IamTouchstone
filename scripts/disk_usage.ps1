$folders = Get-ChildItem 'C:\' -Force -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer }
$result = foreach ($f in $folders) {
  $size = 0
  try { $size = (Get-ChildItem -Path $f.FullName -Recurse -ErrorAction SilentlyContinue -Force | Where-Object { -not $_.PSIsContainer } | Measure-Object -Property Length -Sum).Sum } catch {}
  [PSCustomObject]@{ Path = $f.FullName; SizeBytes = $size; SizeGB = "{0:N2}" -f ($size/1GB) }
}
$result | Sort-Object {[double]$_.SizeGB} -Descending | Format-Table -AutoSize
